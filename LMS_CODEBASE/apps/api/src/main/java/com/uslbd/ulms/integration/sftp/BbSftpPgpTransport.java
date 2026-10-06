package com.uslbd.ulms.integration.sftp;

import org.bouncycastle.bcpg.BCPGOutputStream;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.bouncycastle.openpgp.PGPCompressedDataGenerator;
import org.bouncycastle.openpgp.PGPEncryptedDataGenerator;
import org.bouncycastle.openpgp.PGPLiteralData;
import org.bouncycastle.openpgp.PGPLiteralDataGenerator;
import org.bouncycastle.openpgp.PGPPrivateKey;
import org.bouncycastle.openpgp.PGPPublicKey;
import org.bouncycastle.openpgp.PGPPublicKeyRing;
import org.bouncycastle.openpgp.PGPPublicKeyRingCollection;
import org.bouncycastle.openpgp.PGPSecretKey;
import org.bouncycastle.openpgp.PGPSecretKeyRing;
import org.bouncycastle.openpgp.PGPSecretKeyRingCollection;
import org.bouncycastle.openpgp.PGPSignature;
import org.bouncycastle.openpgp.PGPSignatureGenerator;
import org.bouncycastle.openpgp.PGPUtil;
import org.bouncycastle.bcpg.SymmetricKeyAlgorithmTags;
import org.bouncycastle.openpgp.operator.jcajce.JcaKeyFingerprintCalculator;
import org.bouncycastle.openpgp.operator.jcajce.JcaPGPContentSignerBuilder;
import org.bouncycastle.openpgp.operator.jcajce.JcePBESecretKeyDecryptorBuilder;
import org.bouncycastle.openpgp.operator.jcajce.JcePGPDataEncryptorBuilder;
import org.bouncycastle.openpgp.operator.jcajce.JcePublicKeyKeyEncryptionMethodGenerator;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.security.Security;
import java.util.Date;
import java.util.Iterator;

/**
 * BB SFTP transport (R7): CL/CIB batch files are PGP-SIGNED with the bank
 * signing key then PGP-ENCRYPTED to Bangladesh Bank's public key before the
 * SFTP push (submission tracking lives in the regcon module's regulatory
 * return rows — staged → transmitted → acknowledged).
 * Keys come from the secret store (env-mounted paths); passphrases env-only.
 */
@Component
public class BbSftpPgpTransport {

    static { Security.addProvider(new BouncyCastleProvider()); }

    /** Sign-then-encrypt: the canonical bank-channel order (signature travels inside). */
    public byte[] signThenEncrypt(byte[] plain, String signingKeyArmor, String signingPassphrase,
                                  String encryptionKeyArmor) throws Exception {
        byte[] signed = sign(plain, signingKeyArmor, signingPassphrase.toCharArray());
        return encrypt(signed, encryptionKeyArmor);
    }

    private byte[] sign(byte[] plain, String keyArmor, char[] passphrase) throws Exception {
        PGPSecretKeyRing keyRing = firstSecretKeyRing(keyArmor);
        PGPSecretKey secretKey = keyRing.getSecretKey();
        PGPPrivateKey priv = secretKey.extractPrivateKey(
                new JcePBESecretKeyDecryptorBuilder()
                        .setProvider("BC")
                        .build(passphrase));

        var gen = new PGPSignatureGenerator(
                new JcaPGPContentSignerBuilder(
                        secretKey.getPublicKey().getAlgorithm(), PGPUtil.SHA256)
                        .setProvider("BC"));
        gen.init(PGPSignature.BINARY_DOCUMENT, priv);

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        PGPCompressedDataGenerator compressed = new PGPCompressedDataGenerator(PGPCompressedDataGenerator.ZIP);
        try (BCPGOutputStream bcOut = new BCPGOutputStream(compressed.open(out))) {
            gen.update(plain);
            gen.generate().encode(bcOut);
            bcOut.write(plain);
        }
        return out.toByteArray();
    }

    private byte[] encrypt(byte[] data, String pubKeyArmor) throws Exception {
        PGPPublicKey pub = firstEncryptionKey(pubKeyArmor);
        var encGen = new PGPEncryptedDataGenerator(
                new JcePGPDataEncryptorBuilder(SymmetricKeyAlgorithmTags.AES_256)
                        .setWithIntegrityPacket(true)
                        .setSecureRandom(new SecureRandom())
                        .setProvider("BC"));
        encGen.addMethod(new JcePublicKeyKeyEncryptionMethodGenerator(pub).setProvider("BC"));

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (OutputStream encOut = encGen.open(out, new byte[4096])) {
            var literal = new PGPLiteralDataGenerator();
            try (OutputStream litOut = literal.open(encOut, PGPLiteralData.BINARY,
                    PGPLiteralData.CONSOLE, data.length, new Date())) {
                litOut.write(data);
            }
        }
        return out.toByteArray();
    }

    private static PGPSecretKeyRing firstSecretKeyRing(String armor) throws Exception {
        var rings = new PGPSecretKeyRingCollection(
                PGPUtil.getDecoderStream(new ByteArrayInputStream(armor.getBytes(StandardCharsets.UTF_8))),
                new JcaKeyFingerprintCalculator().setProvider("BC"));
        Iterator<PGPSecretKeyRing> it = rings.getKeyRings();
        if (!it.hasNext()) throw new IllegalArgumentException("no secret key ring in armor");
        return it.next();
    }

    private static PGPPublicKey firstEncryptionKey(String armor) throws Exception {
        var rings = new PGPPublicKeyRingCollection(
                PGPUtil.getDecoderStream(new ByteArrayInputStream(armor.getBytes(StandardCharsets.UTF_8))),
                new JcaKeyFingerprintCalculator().setProvider("BC"));
        Iterator<PGPPublicKeyRing> it = rings.getKeyRings();
        if (!it.hasNext()) throw new IllegalArgumentException("no public key ring in armor");
        Iterator<PGPPublicKey> keys = it.next().getPublicKeys();
        while (keys.hasNext()) {
            PGPPublicKey k = keys.next();
            if (k.isEncryptionKey()) return k;
        }
        throw new IllegalArgumentException("no encryption-capable public key in armor");
    }
}
