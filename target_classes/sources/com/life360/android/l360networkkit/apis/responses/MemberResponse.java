package com.life360.android.l360networkkit.apis.responses;

import defpackage.bz2;
import defpackage.e04;
import defpackage.m87;
import defpackage.wo10;
import defpackage.ywm;
import kotlin.Metadata;
import kotlin.jvm.internal.Intrinsics;

/* JADX INFO: loaded from: classes.dex */
@Metadata(d1 = {"\u0000(\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0006\n\u0002\u0010\t\n\u0000\n\u0002\u0010\u000b\n\u0002\b\u0018\n\u0002\u0010\b\n\u0002\b\u0002\b\u0086\b\u0018\u00002\u00020\u0001BQ\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\b\u0010\u0004\u001a\u0004\u0018\u00010\u0003\u0012\b\u0010\u0005\u001a\u0004\u0018\u00010\u0003\u0012\b\u0010\u0006\u001a\u0004\u0018\u00010\u0003\u0012\b\u0010\u0007\u001a\u0004\u0018\u00010\u0003\u0012\b\u0010\b\u001a\u0004\u0018\u00010\u0003\u0012\u0006\u0010\t\u001a\u00020\n\u0012\u0006\u0010\u000b\u001a\u00020\f¢\u0006\u0004\b\r\u0010\u000eJ\t\u0010\u0019\u001a\u00020\u0003HÆ\u0003J\u000b\u0010\u001a\u001a\u0004\u0018\u00010\u0003HÆ\u0003J\u000b\u0010\u001b\u001a\u0004\u0018\u00010\u0003HÆ\u0003J\u000b\u0010\u001c\u001a\u0004\u0018\u00010\u0003HÆ\u0003J\u000b\u0010\u001d\u001a\u0004\u0018\u00010\u0003HÆ\u0003J\u000b\u0010\u001e\u001a\u0004\u0018\u00010\u0003HÆ\u0003J\t\u0010\u001f\u001a\u00020\nHÆ\u0003J\t\u0010 \u001a\u00020\fHÆ\u0003Jc\u0010!\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\n\b\u0002\u0010\u0004\u001a\u0004\u0018\u00010\u00032\n\b\u0002\u0010\u0005\u001a\u0004\u0018\u00010\u00032\n\b\u0002\u0010\u0006\u001a\u0004\u0018\u00010\u00032\n\b\u0002\u0010\u0007\u001a\u0004\u0018\u00010\u00032\n\b\u0002\u0010\b\u001a\u0004\u0018\u00010\u00032\b\b\u0002\u0010\t\u001a\u00020\n2\b\b\u0002\u0010\u000b\u001a\u00020\fHÆ\u0001J\u0014\u0010\"\u001a\u00020\f2\b\u0010#\u001a\u0004\u0018\u00010\u0001HÖ\u0083\u0004J\n\u0010$\u001a\u00020%HÖ\u0081\u0004J\n\u0010&\u001a\u00020\u0003HÖ\u0081\u0004R\u0011\u0010\u0002\u001a\u00020\u0003¢\u0006\b\n\u0000\u001a\u0004\b\u000f\u0010\u0010R\u0013\u0010\u0004\u001a\u0004\u0018\u00010\u0003¢\u0006\b\n\u0000\u001a\u0004\b\u0011\u0010\u0010R\u0013\u0010\u0005\u001a\u0004\u0018\u00010\u0003¢\u0006\b\n\u0000\u001a\u0004\b\u0012\u0010\u0010R\u0013\u0010\u0006\u001a\u0004\u0018\u00010\u0003¢\u0006\b\n\u0000\u001a\u0004\b\u0013\u0010\u0010R\u0013\u0010\u0007\u001a\u0004\u0018\u00010\u0003¢\u0006\b\n\u0000\u001a\u0004\b\u0014\u0010\u0010R\u0013\u0010\b\u001a\u0004\u0018\u00010\u0003¢\u0006\b\n\u0000\u001a\u0004\b\u0015\u0010\u0010R\u0011\u0010\t\u001a\u00020\n¢\u0006\b\n\u0000\u001a\u0004\b\u0016\u0010\u0017R\u0011\u0010\u000b\u001a\u00020\f¢\u0006\b\n\u0000\u001a\u0004\b\u000b\u0010\u0018¨\u0006'"}, d2 = {"Lcom/life360/android/l360networkkit/apis/responses/MemberResponse;", "", "id", "", e04.KEY_FIRST_NAME, "lastName", "loginEmail", "loginPhone", "avatar", "createdAt", "", "isAdmin", "", "<init>", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;JZ)V", "getId", "()Ljava/lang/String;", "getFirstName", "getLastName", "getLoginEmail", "getLoginPhone", "getAvatar", "getCreatedAt", "()J", "()Z", "component1", "component2", "component3", "component4", "component5", "component6", "component7", "component8", "copy", "equals", "other", "hashCode", "", "toString", "networkkit-l360"}, k = 1, mv = {2, 4, 0}, xi = 48)
public final /* data */ class MemberResponse {
    private final String avatar;
    private final long createdAt;
    private final String firstName;
    private final String id;
    private final boolean isAdmin;
    private final String lastName;
    private final String loginEmail;
    private final String loginPhone;

    public MemberResponse(String str, String str2, String str3, String str4, String str5, String str6, long j, boolean z) {
        this.id = str;
        this.firstName = str2;
        this.lastName = str3;
        this.loginEmail = str4;
        this.loginPhone = str5;
        this.avatar = str6;
        this.createdAt = j;
        this.isAdmin = z;
    }

    public static MemberResponse copy$default(MemberResponse memberResponse, String str, String str2, String str3, String str4, String str5, String str6, long j, boolean z, int i, Object obj) {
        if ((i & 1) != 0) {
            str = memberResponse.id;
        }
        if ((i & 2) != 0) {
            str2 = memberResponse.firstName;
        }
        if ((i & 4) != 0) {
            str3 = memberResponse.lastName;
        }
        if ((i & 8) != 0) {
            str4 = memberResponse.loginEmail;
        }
        if ((i & 16) != 0) {
            str5 = memberResponse.loginPhone;
        }
        if ((i & 32) != 0) {
            str6 = memberResponse.avatar;
        }
        if ((i & 64) != 0) {
            j = memberResponse.createdAt;
        }
        if ((i & 128) != 0) {
            z = memberResponse.isAdmin;
        }
        boolean z2 = z;
        memberResponse.getClass();
        long j2 = j;
        String str7 = str6;
        String str8 = str5;
        String str9 = str3;
        return new MemberResponse(str, str2, str9, str4, str8, str7, j2, z2);
    }

    /* JADX INFO: renamed from: component1, reason: from getter */
    public final String getId() {
        return this.id;
    }

    /* JADX INFO: renamed from: component2, reason: from getter */
    public final String getFirstName() {
        return this.firstName;
    }

    /* JADX INFO: renamed from: component3, reason: from getter */
    public final String getLastName() {
        return this.lastName;
    }

    /* JADX INFO: renamed from: component4, reason: from getter */
    public final String getLoginEmail() {
        return this.loginEmail;
    }

    /* JADX INFO: renamed from: component5, reason: from getter */
    public final String getLoginPhone() {
        return this.loginPhone;
    }

    /* JADX INFO: renamed from: component6, reason: from getter */
    public final String getAvatar() {
        return this.avatar;
    }

    /* JADX INFO: renamed from: component7, reason: from getter */
    public final long getCreatedAt() {
        return this.createdAt;
    }

    /* JADX INFO: renamed from: component8, reason: from getter */
    public final boolean getIsAdmin() {
        return this.isAdmin;
    }

    public final MemberResponse copy(String id, String firstName, String lastName, String loginEmail, String loginPhone, String avatar, long createdAt, boolean isAdmin) {
        return new MemberResponse(id, firstName, lastName, loginEmail, loginPhone, avatar, createdAt, isAdmin);
    }

    public final boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        if (!(other instanceof MemberResponse)) {
            return false;
        }
        MemberResponse memberResponse = (MemberResponse) other;
        return Intrinsics.e(this.id, memberResponse.id) && Intrinsics.e(this.firstName, memberResponse.firstName) && Intrinsics.e(this.lastName, memberResponse.lastName) && Intrinsics.e(this.loginEmail, memberResponse.loginEmail) && Intrinsics.e(this.loginPhone, memberResponse.loginPhone) && Intrinsics.e(this.avatar, memberResponse.avatar) && this.createdAt == memberResponse.createdAt && this.isAdmin == memberResponse.isAdmin;
    }

    public final String getAvatar() {
        return this.avatar;
    }

    public final long getCreatedAt() {
        return this.createdAt;
    }

    public final String getFirstName() {
        return this.firstName;
    }

    public final String getId() {
        return this.id;
    }

    public final String getLastName() {
        return this.lastName;
    }

    public final String getLoginEmail() {
        return this.loginEmail;
    }

    public final String getLoginPhone() {
        return this.loginPhone;
    }

    public final int hashCode() {
        int iHashCode = this.id.hashCode() * 31;
        String str = this.firstName;
        int iHashCode2 = (iHashCode + (str == null ? 0 : str.hashCode())) * 31;
        String str2 = this.lastName;
        int iHashCode3 = (iHashCode2 + (str2 == null ? 0 : str2.hashCode())) * 31;
        String str3 = this.loginEmail;
        int iHashCode4 = (iHashCode3 + (str3 == null ? 0 : str3.hashCode())) * 31;
        String str4 = this.loginPhone;
        int iHashCode5 = (iHashCode4 + (str4 == null ? 0 : str4.hashCode())) * 31;
        String str5 = this.avatar;
        return Boolean.hashCode(this.isAdmin) + ywm.c((iHashCode5 + (str5 != null ? str5.hashCode() : 0)) * 31, 31, this.createdAt);
    }

    public final boolean isAdmin() {
        return this.isAdmin;
    }

    public final String toString() {
        String str = this.id;
        String str2 = this.firstName;
        String str3 = this.lastName;
        String str4 = this.loginEmail;
        String str5 = this.loginPhone;
        String str6 = this.avatar;
        long j = this.createdAt;
        boolean z = this.isAdmin;
        StringBuilder sbT = bz2.t("MemberResponse(id=", str, ", firstName=", str2, ", lastName=");
        m87.B(sbT, str3, ", loginEmail=", str4, ", loginPhone=");
        m87.B(sbT, str5, ", avatar=", str6, ", createdAt=");
        wo10.A(sbT, j, ", isAdmin=", z);
        sbT.append(")");
        return sbT.toString();
    }
}
