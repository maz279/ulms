package com.uslbd.ulms.platform;

import io.netty.handler.ssl.util.InsecureTrustManagerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.reactive.ReactorClientHttpConnector;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.netty.http.Http11SslContextSpec;
import reactor.netty.http.HttpProtocol;
import reactor.netty.http.client.HttpClient;

/**
 * WebClient.Builder for outbound adapters. `ulms.fineract.insecure-tls=true`
 * (DEV/compose ONLY — never in bank environments) trusts Fineract CE's
 * self-signed container TLS; production mounts the bank CA instead.
 *
 * <p>P5 audit F10: the trust-all path is PROFILE-GATED — it refuses to start
 * unless the `dev` or `test` profile is active, so a bank deployment that
 * carries the env flag by mistake fails fast at boot instead of silently
 * disabling certificate verification on a credential-carrying client.
 *
 * The dev trust path pins HTTP/1.1 TLS (Http11SslContextSpec): a generic
 * netty SslContext makes reactor-netty 1.3 negotiate QUIC (netty-quiche),
 * whose native libs aren't present in the container runtime.
 */
@Configuration
public class HttpClientConfig {

    @Bean
    WebClient.Builder webClientBuilder(
            @Value("${ulms.fineract.insecure-tls:false}") boolean insecureTls,
            org.springframework.core.env.Environment env) {
        if (insecureTls) {
            boolean devProfile = env.matchesProfiles("dev | test");
            if (!devProfile) {
                throw new IllegalStateException(
                        "ulms.fineract.insecure-tls=true is DEV/TEST-only (P5 audit F10) — "
                                + "activate the 'dev' profile or mount the bank CA instead");
            }
        }
        HttpClient httpClient = HttpClient.create().protocol(HttpProtocol.HTTP11);
        if (insecureTls) {
            Http11SslContextSpec spec = Http11SslContextSpec.forClient()
                    .configure(builder -> builder.trustManager(InsecureTrustManagerFactory.INSTANCE));
            httpClient = httpClient.secure(ssl -> ssl.sslContext(spec));
        }
        return WebClient.builder().clientConnector(new ReactorClientHttpConnector(httpClient));
    }
}
