package com.life360.android.l360networkkit.internal.authorization;

import com.withpersona.sdk2.inquiry.network.core.HttpStatusCode;
import java.io.IOException;
import kotlin.Metadata;
import kotlin.jvm.functions.Function0;
import kotlin.jvm.internal.DefaultConstructorMarker;
import okhttp3.Interceptor;
import okhttp3.MediaType;
import okhttp3.Protocol;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;

/* JADX INFO: loaded from: classes5.dex */
@Metadata(d1 = {"\u00008\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\b\u0000\u0018\u0000 \u00112\u00020\u0001:\u0001\u0011B\u0015\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u001a\u0002\b\u0006¢\u0006\u0004\b\u0004\u0010\u0005B!\b\u0016\u0012\u0006\u0010\u0007\u001a\u00020\b\u0012\u000e\u0010\t\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u000b0\n¢\u0006\u0004\b\u0004\u0010\fJ\u0010\u0010\r\u001a\u00020\u000e2\u0006\u0010\u000f\u001a\u00020\u0010H\u0016R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004¢\u0006\u0002\n\u0000¨\u0006\u0012"}, d2 = {"Lcom/life360/android/l360networkkit/internal/authorization/RequestAuthorizationInterceptor;", "Lokhttp3/Interceptor;", "makeAuthorizationHeader", "Lcom/life360/android/l360networkkit/internal/authorization/MakeAuthorizationHeader;", "<init>", "(Lcom/life360/android/l360networkkit/internal/authorization/MakeAuthorizationHeader;)V", "Landroidx/annotation/VisibleForTesting;", "basicAuthToken", "", "currentAuthentication", "Lkotlin/Function0;", "Lcom/life360/android/l360networkkit/internal/authorization/StoreAuthenticationResponseInterceptor$Authentication;", "(Ljava/lang/String;Lkotlin/jvm/functions/Function0;)V", "intercept", "Lokhttp3/Response;", "chain", "Lokhttp3/Interceptor$Chain;", "Companion", "networkkit-l360"}, k = 1, mv = {2, 4, 0}, xi = 48)
public final class RequestAuthorizationInterceptor implements Interceptor {
    private static final Companion Companion = new Companion();

    @Deprecated
    public static final String HEADER_AUTHORIZATION = "Authorization";
    private final MakeAuthorizationHeader makeAuthorizationHeader;

    /* JADX WARN: 'this' call moved to the top of the method (can break code semantics) */
    public RequestAuthorizationInterceptor(String str, Function0<StoreAuthenticationResponseInterceptor.Authentication> function0) {
        this(new MakeAuthorizationHeader$Companion$MakeAuthorizationHeader$1(str, function0));
        MakeAuthorizationHeader.INSTANCE.getClass();
    }

    @Override // okhttp3.Interceptor
    public final Response intercept(Interceptor.Chain chain) throws IOException {
        Response responseProceed;
        Request request = chain.request();
        Companion companion = Companion;
        if (companion.isAlreadyAuthorized(request)) {
            return chain.proceed(request);
        }
        String strMo262invokecpn45mY = this.makeAuthorizationHeader.mo262invokecpn45mY(request);
        return (strMo262invokecpn45mY == null || (responseProceed = chain.proceed(companion.m270withByIOr_o(request, strMo262invokecpn45mY))) == null) ? new Response.Builder().code(HttpStatusCode.UNAUTHORIZED_401).request(request).body(ResponseBody.INSTANCE.create("", (MediaType) null)).message("no Authorization header applied").protocol(Protocol.HTTP_1_1).build() : responseProceed;
    }

    @Metadata(d1 = {"\u0000&\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\u000b\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\b\u0082\u0003\u0018\u00002\u00020\u0001B\t\b\u0002¢\u0006\u0004\b\u0002\u0010\u0003J\u0019\u0010\n\u001a\u00020\b*\u00020\b2\u0006\u0010\u000b\u001a\u00020\f¢\u0006\u0004\b\r\u0010\u000eR\u000e\u0010\u0004\u001a\u00020\u0005X\u0086T¢\u0006\u0002\n\u0000R\u0015\u0010\u0006\u001a\u00020\u0007*\u00020\b8F¢\u0006\u0006\u001a\u0004\b\u0006\u0010\t¨\u0006\u000f"}, d2 = {"Lcom/life360/android/l360networkkit/internal/authorization/RequestAuthorizationInterceptor$Companion;", "", "<init>", "()V", "HEADER_AUTHORIZATION", "", "isAlreadyAuthorized", "", "Lokhttp3/Request;", "(Lokhttp3/Request;)Z", "with", "authorizationHeader", "Lcom/life360/android/l360networkkit/internal/authorization/MakeAuthorizationHeader$Authorization;", "with-ByIOr_o", "(Lokhttp3/Request;Ljava/lang/String;)Lokhttp3/Request;", "networkkit-l360"}, k = 1, mv = {2, 4, 0}, xi = 48)
    public static final class Companion {
        private Companion() {
        }

        public final boolean isAlreadyAuthorized(Request request) {
            String strHeader = request.header("Authorization");
            return !(strHeader == null || strHeader.length() == 0);
        }

        /* JADX INFO: renamed from: with-ByIOr_o, reason: not valid java name */
        public final Request m270withByIOr_o(Request request, String str) {
            return request.newBuilder().addHeader("Authorization", str).build();
        }

        public Companion(DefaultConstructorMarker defaultConstructorMarker) {
        }
    }

    public RequestAuthorizationInterceptor(MakeAuthorizationHeader makeAuthorizationHeader) {
        this.makeAuthorizationHeader = makeAuthorizationHeader;
    }
}
