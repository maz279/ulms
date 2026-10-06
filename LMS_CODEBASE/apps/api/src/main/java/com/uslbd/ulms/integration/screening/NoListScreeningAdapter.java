package com.uslbd.ulms.integration.screening;

import org.springframework.stereotype.Component;

/**
 * P1 default adapter: no lists configured yet → always CLEAR. The hook is
 * armed (endpoint + persistence + audit live); P2 swaps this bean for the
 * list-file/AML-provider adapter behind the same port (06 §8).
 */
@Component
// mutual exclusion with the live adapter (screening-live flag, R7)
@org.springframework.context.annotation.Profile("!screening-live")
class NoListScreeningAdapter implements ScreeningPort {

    @Override
    public ScreeningResult screen(String nameEn) {
        return ScreeningResult.CLEAR;
    }
}
