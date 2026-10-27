package com.life360.android.l360networkkit.apis.responses;

import defpackage.ln10;
import java.util.List;
import kotlin.Metadata;
import kotlin.jvm.internal.Intrinsics;

/* JADX INFO: loaded from: classes.dex */
@Metadata(d1 = {"\u0000*\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0007\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0000\b\u0086\b\u0018\u00002\u00020\u0001B\u0015\u0012\f\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003¢\u0006\u0004\b\u0005\u0010\u0006J\u000f\u0010\t\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003HÆ\u0003J\u0019\u0010\n\u001a\u00020\u00002\u000e\b\u0002\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003HÆ\u0001J\u0014\u0010\u000b\u001a\u00020\f2\b\u0010\r\u001a\u0004\u0018\u00010\u0001HÖ\u0083\u0004J\n\u0010\u000e\u001a\u00020\u000fHÖ\u0081\u0004J\n\u0010\u0010\u001a\u00020\u0011HÖ\u0081\u0004R\u0017\u0010\u0002\u001a\b\u0012\u0004\u0012\u00020\u00040\u0003¢\u0006\b\n\u0000\u001a\u0004\b\u0007\u0010\b¨\u0006\u0012"}, d2 = {"Lcom/life360/android/l360networkkit/apis/responses/MembersResponse;", "", "members", "", "Lcom/life360/android/l360networkkit/apis/responses/MemberResponse;", "<init>", "(Ljava/util/List;)V", "getMembers", "()Ljava/util/List;", "component1", "copy", "equals", "", "other", "hashCode", "", "toString", "", "networkkit-l360"}, k = 1, mv = {2, 4, 0}, xi = 48)
public final /* data */ class MembersResponse {
    private final List<MemberResponse> members;

    public MembersResponse(List<MemberResponse> list) {
        this.members = list;
    }

    public static MembersResponse copy$default(MembersResponse membersResponse, List list, int i, Object obj) {
        if ((i & 1) != 0) {
            list = membersResponse.members;
        }
        membersResponse.getClass();
        return new MembersResponse(list);
    }

    public final List<MemberResponse> component1() {
        return this.members;
    }

    public final MembersResponse copy(List<MemberResponse> members) {
        return new MembersResponse(members);
    }

    public final boolean equals(Object other) {
        if (this == other) {
            return true;
        }
        return (other instanceof MembersResponse) && Intrinsics.e(this.members, ((MembersResponse) other).members);
    }

    public final List<MemberResponse> getMembers() {
        return this.members;
    }

    public final int hashCode() {
        return this.members.hashCode();
    }

    public final String toString() {
        return ln10.o("MembersResponse(members=", ")", this.members);
    }
}
