package com.life360.android.l360networkkit.internal.authorization;

import com.life360.android.l360networkkit.internal.RequestGetAnnotationKt;
import defpackage.gz70;
import defpackage.zew;
import kotlin.Metadata;
import kotlin.jvm.internal.DefaultConstructorMarker;
import kotlin.text.StringsKt;
import okhttp3.Request;

/* JADX INFO: loaded from: classes5.dex */
@Metadata(d1 = {"\u0000\"\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0004\b\u0000\u0018\u0000 \u00102\u00020\u0001:\u0001\u0010B\u000f\u0012\u0006\u0010\u0002\u001a\u00020\u0003¢\u0006\u0004\b\u0004\u0010\u0005J\u001a\u0010\u000b\u001a\u0004\u0018\u00010\t2\u0006\u0010\f\u001a\u00020\rH\u0096\u0002¢\u0006\u0004\b\u000e\u0010\u000fR\u0011\u0010\u0002\u001a\u00020\u0003¢\u0006\b\n\u0000\u001a\u0004\b\u0006\u0010\u0007R\u0010\u0010\b\u001a\u00020\tX\u0082\u0004¢\u0006\u0004\n\u0002\u0010\n¨\u0006\u0011"}, d2 = {"Lcom/life360/android/l360networkkit/internal/authorization/MakeBasicAuthorizationHeader;", "Lcom/life360/android/l360networkkit/internal/authorization/MakeAuthorizationHeader;", "token", "", "<init>", "(Ljava/lang/String;)V", "getToken", "()Ljava/lang/String;", "authorization", "Lcom/life360/android/l360networkkit/internal/authorization/MakeAuthorizationHeader$Authorization;", "Ljava/lang/String;", "invoke", "forRequest", "Lokhttp3/Request;", "invoke-cpn45mY", "(Lokhttp3/Request;)Ljava/lang/String;", "Companion", "networkkit-l360"}, k = 1, mv = {2, 4, 0}, xi = 48)
public final class MakeBasicAuthorizationHeader implements MakeAuthorizationHeader {
    private static final Companion Companion = new Companion();
    private final String authorization;
    private final String token;

    public MakeBasicAuthorizationHeader(String str) {
        this.token = str;
        String str2 = "Basic " + str;
        MakeAuthorizationHeader.Authorization.m264constructorimpl(str2);
        this.authorization = str2;
        if (StringsKt.Q(str)) {
            gz70.r("Failed requirement.");
            throw null;
        }
    }

    public final String getToken() {
        return this.token;
    }

    @Override // com.life360.android.l360networkkit.internal.authorization.MakeAuthorizationHeader
    /* JADX INFO: renamed from: invoke-cpn45mY */
    public final String mo262invokecpn45mY(Request forRequest) {
        if (Companion.getRequiresBasicAuth(forRequest)) {
            return this.authorization;
        }
        return null;
    }

    @Metadata(d1 = {"\u0000\u0018\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0003\n\u0002\u0010\u000b\n\u0002\u0018\u0002\n\u0002\b\u0003\b\u0082\u0003\u0018\u00002\u00020\u0001B\t\b\u0002¢\u0006\u0004\b\u0002\u0010\u0003R\u0015\u0010\u0004\u001a\u00020\u0005*\u00020\u00068F¢\u0006\u0006\u001a\u0004\b\u0007\u0010\b¨\u0006\t"}, d2 = {"Lcom/life360/android/l360networkkit/internal/authorization/MakeBasicAuthorizationHeader$Companion;", "", "<init>", "()V", "requiresBasicAuth", "", "Lokhttp3/Request;", "getRequiresBasicAuth", "(Lokhttp3/Request;)Z", "networkkit-l360"}, k = 1, mv = {2, 4, 0}, xi = 48)
    public static final class Companion {
        private Companion() {
        }

        public final boolean getRequiresBasicAuth(Request request) {
            return RequestGetAnnotationKt.getAnnotation(request, zew.a.b(RequiresBasicAuth.class)) != null;
        }

        public Companion(DefaultConstructorMarker defaultConstructorMarker) {
        }
    }
}
