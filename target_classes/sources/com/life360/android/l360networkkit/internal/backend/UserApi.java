package com.life360.android.l360networkkit.internal.backend;

import com.life360.android.l360networkkit.internal.authorization.AuthenticationRequest;
import com.life360.android.l360networkkit.internal.authorization.RequiresBasicAuth;
import com.life360.android.l360networkkit.model.UserAuthResponse;
import com.life360.android.l360networkkit.model.UserResponse;
import com.life360.android.membersengine.network.requests.RegisterDeviceToUserRequest;
import defpackage.cy7;
import defpackage.e04;
import defpackage.jng;
import defpackage.nwr;
import defpackage.suw;
import defpackage.x4g;
import defpackage.xxe;
import kotlin.Metadata;

/* JADX INFO: loaded from: classes5.dex */
@Metadata(d1 = {"\u0000$\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\u0010\u000e\n\u0002\b\n\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\b`\u0018\u00002\u00020\u0001J\u0080\u0001\u0010\u000f\u001a\b\u0012\u0004\u0012\u00020\u000e0\r2\b\b\u0001\u0010\u0003\u001a\u00020\u00022\b\b\u0001\u0010\u0004\u001a\u00020\u00022\n\b\u0001\u0010\u0005\u001a\u0004\u0018\u00010\u00022\n\b\u0001\u0010\u0006\u001a\u0004\u0018\u00010\u00022\b\b\u0001\u0010\u0007\u001a\u00020\u00022\n\b\u0001\u0010\b\u001a\u0004\u0018\u00010\u00022\b\b\u0001\u0010\t\u001a\u00020\u00022\b\b\u0001\u0010\n\u001a\u00020\u00022\b\b\u0001\u0010\u000b\u001a\u00020\u00022\b\b\u0001\u0010\f\u001a\u00020\u0002H§@¢\u0006\u0004\b\u000f\u0010\u0010J\u0016\u0010\u0012\u001a\b\u0012\u0004\u0012\u00020\u00110\rH§@¢\u0006\u0004\b\u0012\u0010\u0013¨\u0006\u0014À\u0006\u0003"}, d2 = {"Lcom/life360/android/l360networkkit/internal/backend/UserApi;", "", "", "password", "email", "nationalNumber", "countryCode", e04.KEY_FIRST_NAME, "lastName", "packageName", "dateFormat", "timeZone", "locale", "Lsuw;", "Lcom/life360/android/l360networkkit/model/UserAuthResponse;", "createUser", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/l360networkkit/model/UserResponse;", "getCurrentUser", "(Lcy7;)Ljava/lang/Object;", "networkkit-l360"}, k = 1, mv = {2, 4, 0}, xi = 48)
public interface UserApi {
    @RequiresBasicAuth
    @AuthenticationRequest
    @x4g
    @nwr("v3/users")
    Object createUser(@xxe("password") String str, @xxe("email") String str2, @xxe("phone") String str3, @xxe("countryCode") String str4, @xxe(e04.KEY_FIRST_NAME) String str5, @xxe("lastName") String str6, @xxe(RegisterDeviceToUserRequest.KEY_APP_ID) String str7, @xxe("settings[dateFormat]") String str8, @xxe("settings[timeZone]") String str9, @xxe("settings[locale]") String str10, cy7<? super suw<UserAuthResponse>> cy7Var);

    @jng("v3/me")
    Object getCurrentUser(cy7<? super suw<UserResponse>> cy7Var);
}
