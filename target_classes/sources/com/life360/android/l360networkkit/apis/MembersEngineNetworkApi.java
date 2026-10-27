package com.life360.android.l360networkkit.apis;

import com.life360.android.l360networkkit.apis.request.ActivateTrackerBody;
import com.life360.android.l360networkkit.apis.request.AutoTileAccountCreationRequest;
import com.life360.android.l360networkkit.apis.request.ClaimVerifyOtpRequest;
import com.life360.android.l360networkkit.apis.request.CreateOtpUserRequest;
import com.life360.android.l360networkkit.apis.request.ReportDeviceFirmwareVersionRequestBody;
import com.life360.android.l360networkkit.apis.request.SignInClaimSendOtpRequest;
import com.life360.android.l360networkkit.apis.request.SignInRecoveryChallengeRequest;
import com.life360.android.l360networkkit.apis.request.SignInRecoveryTokenRequest;
import com.life360.android.l360networkkit.apis.request.SignInSendOtpRequest;
import com.life360.android.l360networkkit.apis.request.SignInVerifyOtpRequest;
import com.life360.android.l360networkkit.apis.request.SignUpClaimSendOtpRequest;
import com.life360.android.l360networkkit.apis.request.SignUpClaimVerifyOtpRequest;
import com.life360.android.l360networkkit.apis.request.SignUpSendEmailOtpRequest;
import com.life360.android.l360networkkit.apis.request.SignUpSendOtpRequest;
import com.life360.android.l360networkkit.apis.request.SignUpVerifyOtpRequest;
import com.life360.android.l360networkkit.apis.request.UpdateDeviceProfileRequestBody;
import com.life360.android.l360networkkit.apis.request.UpdateMemberRoleRequestBody;
import com.life360.android.l360networkkit.apis.responses.ActivateTrackerResponse;
import com.life360.android.l360networkkit.apis.responses.AutoTileAccountCreationResponse;
import com.life360.android.l360networkkit.apis.responses.CircleListResponse;
import com.life360.android.l360networkkit.apis.responses.CircleResponse;
import com.life360.android.l360networkkit.apis.responses.CirclesCodeResponse;
import com.life360.android.l360networkkit.apis.responses.ConfirmIntegrationResponse;
import com.life360.android.l360networkkit.apis.responses.CreateOtpUserResponse;
import com.life360.android.l360networkkit.apis.responses.DeactivateTrackerResponse;
import com.life360.android.l360networkkit.apis.responses.DsarResponse;
import com.life360.android.l360networkkit.apis.responses.FinalizeActivationTrackerResponse;
import com.life360.android.l360networkkit.apis.responses.FinalizeDeactivationTrackerResponse;
import com.life360.android.l360networkkit.apis.responses.GetAdornmentsCeType3Response;
import com.life360.android.l360networkkit.apis.responses.GetAdornmentsResponse3;
import com.life360.android.l360networkkit.apis.responses.GetCircleDeviceLocationsResponseWithState;
import com.life360.android.l360networkkit.apis.responses.GetCircleDevicesIssuesResponse;
import com.life360.android.l360networkkit.apis.responses.GetCirclePhonesResponse;
import com.life360.android.l360networkkit.apis.responses.GetDevicesResponse3;
import com.life360.android.l360networkkit.apis.responses.GetIntegrationsResponse;
import com.life360.android.l360networkkit.apis.responses.JoinCircleResponse;
import com.life360.android.l360networkkit.apis.responses.LookupResponse;
import com.life360.android.l360networkkit.apis.responses.MemberRoleResponse;
import com.life360.android.l360networkkit.apis.responses.MembersDeviceStatesResponse;
import com.life360.android.l360networkkit.apis.responses.MembersResponse;
import com.life360.android.l360networkkit.apis.responses.OtpClaimSendResponse;
import com.life360.android.l360networkkit.apis.responses.PhoneValidationResponse;
import com.life360.android.l360networkkit.apis.responses.SignInOtpVerifyResponse;
import com.life360.android.l360networkkit.apis.responses.SignInRecoveryChallengeResponse;
import com.life360.android.l360networkkit.apis.responses.SignInSendOtpResponse;
import com.life360.android.l360networkkit.apis.responses.SignUpClaimSendOtpResponse;
import com.life360.android.l360networkkit.apis.responses.SignUpOtpSendResponse;
import com.life360.android.l360networkkit.apis.responses.UpdateDeviceProfileResponse;
import com.life360.android.l360networkkit.apis.responses.UpdateMemberAvatarResponse;
import com.life360.android.l360networkkit.apis.responses.UpdateUserAvatarResponse;
import com.life360.android.l360networkkit.apis.responses.UserAuthResponse;
import com.life360.android.l360networkkit.apis.responses.UserResponse;
import com.life360.android.l360networkkit.internal.headers.CloudEventHeaderInterceptor;
import com.life360.android.membersengine.Metrics;
import com.life360.android.membersengine.network.requests.RegisterDeviceToUserRequest;
import defpackage.ayh;
import defpackage.cy7;
import defpackage.e04;
import defpackage.fye;
import defpackage.g1s;
import defpackage.h09;
import defpackage.hds;
import defpackage.hs3;
import defpackage.jng;
import defpackage.lyh;
import defpackage.nwp;
import defpackage.nwr;
import defpackage.p7s;
import defpackage.ptv;
import defpackage.rtv;
import defpackage.suw;
import defpackage.x4g;
import defpackage.xxe;
import io.sentry.i6;
import java.util.List;
import java.util.Map;
import kotlin.Metadata;
import kotlin.Unit;
import okhttp3.MultipartBody;

/* JADX INFO: loaded from: classes.dex */
@Metadata(d1 = {"\u0000¸\u0003\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010$\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0006\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0006\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0010\b\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\n\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0006\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0006\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\bf\u0018\u00002\u00020\u0001J\u0016\u0010\u0004\u001a\b\u0012\u0004\u0012\u00020\u00030\u0002H§@¢\u0006\u0004\b\u0004\u0010\u0005J,\u0010\n\u001a\b\u0012\u0004\u0012\u00020\t0\u00022\u0014\b\u0001\u0010\b\u001a\u000e\u0012\u0004\u0012\u00020\u0007\u0012\u0004\u0012\u00020\u00070\u0006H§@¢\u0006\u0004\b\n\u0010\u000bJ,\u0010\f\u001a\b\u0012\u0004\u0012\u00020\u00030\u00022\u0014\b\u0001\u0010\b\u001a\u000e\u0012\u0004\u0012\u00020\u0007\u0012\u0004\u0012\u00020\u00070\u0006H§@¢\u0006\u0004\b\f\u0010\u000bJ,\u0010\u0011\u001a\b\u0012\u0004\u0012\u00020\u00100\u00022\b\b\u0001\u0010\u000e\u001a\u00020\r2\n\b\u0001\u0010\u000f\u001a\u0004\u0018\u00010\rH§@¢\u0006\u0004\b\u0011\u0010\u0012J,\u0010\u0013\u001a\b\u0012\u0004\u0012\u00020\t0\u00022\u0014\b\u0001\u0010\b\u001a\u000e\u0012\u0004\u0012\u00020\u0007\u0012\u0004\u0012\u00020\u00070\u0006H§@¢\u0006\u0004\b\u0013\u0010\u000bJ,\u0010\u0015\u001a\b\u0012\u0004\u0012\u00020\u00140\u00022\u0014\b\u0001\u0010\b\u001a\u000e\u0012\u0004\u0012\u00020\u0007\u0012\u0004\u0012\u00020\u00070\u0006H§@¢\u0006\u0004\b\u0015\u0010\u000bJ \u0010\u0018\u001a\b\u0012\u0004\u0012\u00020\u00170\u00022\b\b\u0001\u0010\u0016\u001a\u00020\u0007H§@¢\u0006\u0004\b\u0018\u0010\u0019J\u0016\u0010\u001a\u001a\b\u0012\u0004\u0012\u00020\u00170\u0002H§@¢\u0006\u0004\b\u001a\u0010\u0005J,\u0010\u001c\u001a\b\u0012\u0004\u0012\u00020\u001b0\u00022\u0014\b\u0001\u0010\b\u001a\u000e\u0012\u0004\u0012\u00020\u0007\u0012\u0004\u0012\u00020\u00070\u0006H§@¢\u0006\u0004\b\u001c\u0010\u000bJ6\u0010\u001f\u001a\b\u0012\u0004\u0012\u00020\u001e0\u00022\b\b\u0001\u0010\u001d\u001a\u00020\u00072\u0014\b\u0001\u0010\b\u001a\u000e\u0012\u0004\u0012\u00020\u0007\u0012\u0004\u0012\u00020\u00070\u0006H§@¢\u0006\u0004\b\u001f\u0010 J,\u0010!\u001a\b\u0012\u0004\u0012\u00020\u00170\u00022\u0014\b\u0001\u0010\b\u001a\u000e\u0012\u0004\u0012\u00020\u0007\u0012\u0004\u0012\u00020\u00070\u0006H§@¢\u0006\u0004\b!\u0010\u000bJ6\u0010&\u001a\b\u0012\u0004\u0012\u00020%0\u00022\b\b\u0001\u0010\"\u001a\u00020\u00072\b\b\u0001\u0010#\u001a\u00020\u00072\n\b\u0003\u0010$\u001a\u0004\u0018\u00010\u0007H§@¢\u0006\u0004\b&\u0010'J\"\u0010+\u001a\b\u0012\u0004\u0012\u00020*0\u00022\n\b\u0001\u0010)\u001a\u0004\u0018\u00010(H§@¢\u0006\u0004\b+\u0010,J4\u0010.\u001a\b\u0012\u0004\u0012\u00020%0\u00022\b\b\u0001\u0010-\u001a\u00020\u00072\b\b\u0001\u0010\"\u001a\u00020\u00072\b\b\u0001\u0010#\u001a\u00020\u0007H§@¢\u0006\u0004\b.\u0010'J*\u00102\u001a\b\u0012\u0004\u0012\u0002010\u00022\b\b\u0001\u0010/\u001a\u00020\u00072\b\b\u0001\u00100\u001a\u00020\u0007H§@¢\u0006\u0004\b2\u00103J*\u00104\u001a\b\u0012\u0004\u0012\u0002010\u00022\b\b\u0001\u0010/\u001a\u00020\u00072\b\b\u0001\u00100\u001a\u00020\u0007H§@¢\u0006\u0004\b4\u00103J \u00106\u001a\b\u0012\u0004\u0012\u0002050\u00022\b\b\u0001\u0010/\u001a\u00020\u0007H§@¢\u0006\u0004\b6\u0010\u0019J&\u00109\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u000208070\u00022\b\b\u0001\u0010/\u001a\u00020\u0007H§@¢\u0006\u0004\b9\u0010\u0019J*\u0010;\u001a\b\u0012\u0004\u0012\u00020\u00170\u00022\b\b\u0001\u0010/\u001a\u00020\u00072\b\b\u0001\u0010:\u001a\u00020\u0007H§@¢\u0006\u0004\b;\u00103J4\u0010>\u001a\b\u0012\u0004\u0012\u00020\u00170\u00022\b\b\u0001\u0010/\u001a\u00020\u00072\b\b\u0001\u0010:\u001a\u00020\u00072\b\b\u0001\u0010=\u001a\u00020<H§@¢\u0006\u0004\b>\u0010?J4\u0010B\u001a\b\u0012\u0004\u0012\u00020\u00170\u00022\b\b\u0001\u0010/\u001a\u00020\u00072\b\b\u0001\u0010:\u001a\u00020\u00072\b\b\u0001\u0010A\u001a\u00020@H§@¢\u0006\u0004\bB\u0010CJ \u0010E\u001a\b\u0012\u0004\u0012\u00020D0\u00022\b\b\u0001\u0010/\u001a\u00020\u0007H§@¢\u0006\u0004\bE\u0010\u0019J \u0010G\u001a\b\u0012\u0004\u0012\u00020F0\u00022\b\b\u0001\u0010/\u001a\u00020\u0007H§@¢\u0006\u0004\bG\u0010\u0019J@\u0010I\u001a\b\u0012\u0004\u0012\u00020H0\u00022\b\b\u0001\u0010/\u001a\u00020\u00072\b\b\u0001\u0010:\u001a\u00020\u00072\b\b\u0001\u0010\u000e\u001a\u00020\r2\n\b\u0001\u0010\u000f\u001a\u0004\u0018\u00010\rH§@¢\u0006\u0004\bI\u0010JJ4\u0010N\u001a\b\u0012\u0004\u0012\u00020M0\u00022\b\b\u0001\u0010/\u001a\u00020\u00072\b\b\u0001\u0010K\u001a\u00020\u00072\b\b\u0001\u0010L\u001a\u00020\u0007H§@¢\u0006\u0004\bN\u0010'J4\u0010P\u001a\b\u0012\u0004\u0012\u00020O0\u00022\b\b\u0001\u0010/\u001a\u00020\u00072\b\b\u0001\u0010K\u001a\u00020\u00072\b\b\u0001\u0010L\u001a\u00020\u0007H§@¢\u0006\u0004\bP\u0010'JR\u0010T\u001a\b\u0012\u0004\u0012\u00020\u00170\u00022\b\b\u0001\u0010Q\u001a\u00020\u00072\b\b\u0001\u0010/\u001a\u00020\u00072\b\b\u0001\u0010K\u001a\u00020\u00072\b\b\u0001\u0010L\u001a\u00020\u00072\b\b\u0001\u0010R\u001a\u00020\u00072\b\b\u0001\u0010S\u001a\u00020\u0007H§@¢\u0006\u0004\bT\u0010UJR\u0010X\u001a\b\u0012\u0004\u0012\u00020\u00170\u00022\b\b\u0001\u0010Q\u001a\u00020\u00072\b\b\u0001\u0010/\u001a\u00020\u00072\b\b\u0001\u0010K\u001a\u00020\u00072\b\b\u0001\u0010L\u001a\u00020\u00072\b\b\u0001\u0010V\u001a\u00020\u00072\b\b\u0001\u0010W\u001a\u00020\u0007H§@¢\u0006\u0004\bX\u0010UJ\"\u0010[\u001a\b\u0012\u0004\u0012\u00020Z0\u00022\n\b\u0001\u0010Y\u001a\u0004\u0018\u00010\u0007H§@¢\u0006\u0004\b[\u0010\u0019J*\u0010]\u001a\b\u0012\u0004\u0012\u00020\\0\u00022\b\b\u0001\u0010Q\u001a\u00020\u00072\b\b\u0001\u0010/\u001a\u00020\u0007H§@¢\u0006\u0004\b]\u00103J*\u0010_\u001a\b\u0012\u0004\u0012\u00020^0\u00022\b\b\u0001\u0010Q\u001a\u00020\u00072\b\b\u0001\u0010/\u001a\u00020\u0007H§@¢\u0006\u0004\b_\u00103J<\u0010b\u001a\b\u0012\u0004\u0012\u00020a0\u00022\b\b\u0001\u0010Q\u001a\u00020\u00072\b\b\u0001\u0010/\u001a\u00020\u00072\u0010\b\u0001\u0010`\u001a\n\u0012\u0004\u0012\u00020\u0007\u0018\u000107H§@¢\u0006\u0004\bb\u0010cJ*\u0010e\u001a\b\u0012\u0004\u0012\u00020\u00170\u00022\b\b\u0001\u0010Q\u001a\u00020\u00072\b\b\u0001\u0010d\u001a\u00020\u0007H§@¢\u0006\u0004\be\u00103JH\u0010i\u001a\b\u0012\u0004\u0012\u00020h0\u00022\b\b\u0001\u0010Q\u001a\u00020\u00072\b\b\u0001\u0010f\u001a\u00020\u00072\b\b\u0001\u0010d\u001a\u00020\u00072\b\b\u0001\u00100\u001a\u00020\u00072\b\b\u0001\u0010g\u001a\u00020\u0007H§@¢\u0006\u0004\bi\u0010jJ \u0010l\u001a\b\u0012\u0004\u0012\u00020k0\u00022\b\b\u0001\u0010Q\u001a\u00020\u0007H§@¢\u0006\u0004\bl\u0010\u0019J*\u0010m\u001a\b\u0012\u0004\u0012\u00020\u00170\u00022\b\b\u0001\u0010Q\u001a\u00020\u00072\b\b\u0001\u0010-\u001a\u00020\u0007H§@¢\u0006\u0004\bm\u00103J*\u0010p\u001a\b\u0012\u0004\u0012\u00020o0\u00022\b\b\u0001\u0010#\u001a\u00020\u00072\b\b\u0001\u0010A\u001a\u00020nH§@¢\u0006\u0004\bp\u0010qJ*\u0010p\u001a\b\u0012\u0004\u0012\u00020o0\u00022\b\b\u0001\u0010#\u001a\u00020\u00072\b\b\u0001\u0010A\u001a\u00020rH§@¢\u0006\u0004\bp\u0010sJ*\u0010u\u001a\b\u0012\u0004\u0012\u00020\u00170\u00022\b\b\u0001\u0010#\u001a\u00020\u00072\b\b\u0001\u0010A\u001a\u00020tH§@¢\u0006\u0004\bu\u0010vJ*\u0010y\u001a\b\u0012\u0004\u0012\u00020x0\u00022\b\b\u0001\u0010#\u001a\u00020\u00072\b\b\u0001\u0010A\u001a\u00020wH§@¢\u0006\u0004\by\u0010zJ*\u0010}\u001a\b\u0012\u0004\u0012\u00020|0\u00022\b\b\u0001\u0010#\u001a\u00020\u00072\b\b\u0001\u0010A\u001a\u00020{H§@¢\u0006\u0004\b}\u0010~J+\u0010}\u001a\b\u0012\u0004\u0012\u00020|0\u00022\b\b\u0001\u0010#\u001a\u00020\u00072\b\b\u0001\u0010A\u001a\u00020\u007fH§@¢\u0006\u0005\b}\u0010\u0080\u0001J,\u0010\u0081\u0001\u001a\b\u0012\u0004\u0012\u00020|0\u00022\b\b\u0001\u0010#\u001a\u00020\u00072\b\b\u0001\u0010A\u001a\u00020{H§@¢\u0006\u0005\b\u0081\u0001\u0010~J/\u0010\u0084\u0001\u001a\t\u0012\u0005\u0012\u00030\u0083\u00010\u00022\b\b\u0001\u0010#\u001a\u00020\u00072\t\b\u0001\u0010A\u001a\u00030\u0082\u0001H§@¢\u0006\u0006\b\u0084\u0001\u0010\u0085\u0001J/\u0010\u0086\u0001\u001a\t\u0012\u0005\u0012\u00030\u0083\u00010\u00022\b\b\u0001\u0010#\u001a\u00020\u00072\t\b\u0001\u0010A\u001a\u00030\u0082\u0001H§@¢\u0006\u0006\b\u0086\u0001\u0010\u0085\u0001J/\u0010\u0089\u0001\u001a\t\u0012\u0005\u0012\u00030\u0088\u00010\u00022\b\b\u0001\u0010#\u001a\u00020\u00072\t\b\u0001\u0010A\u001a\u00030\u0087\u0001H§@¢\u0006\u0006\b\u0089\u0001\u0010\u008a\u0001J/\u0010\u008c\u0001\u001a\t\u0012\u0005\u0012\u00030\u0083\u00010\u00022\b\b\u0001\u0010#\u001a\u00020\u00072\t\b\u0001\u0010A\u001a\u00030\u008b\u0001H§@¢\u0006\u0006\b\u008c\u0001\u0010\u008d\u0001J/\u0010\u0090\u0001\u001a\t\u0012\u0005\u0012\u00030\u008f\u00010\u00022\b\b\u0001\u0010#\u001a\u00020\u00072\t\b\u0001\u0010A\u001a\u00030\u008e\u0001H§@¢\u0006\u0006\b\u0090\u0001\u0010\u0091\u0001J.\u0010\u0093\u0001\u001a\b\u0012\u0004\u0012\u00020\u00170\u00022\b\b\u0001\u0010#\u001a\u00020\u00072\t\b\u0001\u0010A\u001a\u00030\u0092\u0001H§@¢\u0006\u0006\b\u0093\u0001\u0010\u0094\u0001J/\u0010\u0097\u0001\u001a\t\u0012\u0005\u0012\u00030\u0096\u00010\u00022\b\b\u0001\u0010#\u001a\u00020\u00072\t\b\u0001\u0010A\u001a\u00030\u0095\u0001H§@¢\u0006\u0006\b\u0097\u0001\u0010\u0098\u0001J/\u0010\u0097\u0001\u001a\t\u0012\u0005\u0012\u00030\u0096\u00010\u00022\b\b\u0001\u0010#\u001a\u00020\u00072\t\b\u0001\u0010A\u001a\u00030\u0099\u0001H§@¢\u0006\u0006\b\u0097\u0001\u0010\u009a\u0001J/\u0010\u0097\u0001\u001a\t\u0012\u0005\u0012\u00030\u0096\u00010\u00022\b\b\u0001\u0010#\u001a\u00020\u00072\t\b\u0001\u0010A\u001a\u00030\u009b\u0001H§@¢\u0006\u0006\b\u0097\u0001\u0010\u009c\u0001J.\u0010\u009e\u0001\u001a\b\u0012\u0004\u0012\u00020\u00170\u00022\b\b\u0001\u0010#\u001a\u00020\u00072\t\b\u0001\u0010A\u001a\u00030\u009d\u0001H§@¢\u0006\u0006\b\u009e\u0001\u0010\u009f\u0001J/\u0010¢\u0001\u001a\t\u0012\u0005\u0012\u00030¡\u00010\u00022\b\b\u0001\u0010d\u001a\u00020\u00072\t\b\u0001\u0010A\u001a\u00030 \u0001H§@¢\u0006\u0006\b¢\u0001\u0010£\u0001J.\u0010¦\u0001\u001a\t\u0012\u0005\u0012\u00030¥\u00010\u00022\b\b\u0001\u0010d\u001a\u00020\u00072\t\b\u0001\u0010¤\u0001\u001a\u00020\u0007H§@¢\u0006\u0005\b¦\u0001\u00103J:\u0010©\u0001\u001a\t\u0012\u0005\u0012\u00030¨\u00010\u00022\b\b\u0001\u0010d\u001a\u00020\u00072\t\b\u0001\u0010¤\u0001\u001a\u00020\u00072\t\b\u0001\u0010A\u001a\u00030§\u0001H§@¢\u0006\u0006\b©\u0001\u0010ª\u0001J.\u0010¬\u0001\u001a\t\u0012\u0005\u0012\u00030«\u00010\u00022\b\b\u0001\u0010d\u001a\u00020\u00072\t\b\u0001\u0010¤\u0001\u001a\u00020\u0007H§@¢\u0006\u0005\b¬\u0001\u00103J.\u0010®\u0001\u001a\t\u0012\u0005\u0012\u00030\u00ad\u00010\u00022\b\b\u0001\u0010d\u001a\u00020\u00072\t\b\u0001\u0010¤\u0001\u001a\u00020\u0007H§@¢\u0006\u0005\b®\u0001\u00103J9\u0010°\u0001\u001a\b\u0012\u0004\u0012\u00020\u00170\u00022\b\b\u0001\u0010d\u001a\u00020\u00072\t\b\u0001\u0010¤\u0001\u001a\u00020\u00072\t\b\u0001\u0010A\u001a\u00030¯\u0001H§@¢\u0006\u0006\b°\u0001\u0010±\u0001J-\u0010²\u0001\u001a\b\u0012\u0004\u0012\u00020\u00170\u00022\b\b\u0001\u0010d\u001a\u00020\u00072\t\b\u0001\u0010¤\u0001\u001a\u00020\u0007H§@¢\u0006\u0005\b²\u0001\u00103JT\u0010·\u0001\u001a\t\u0012\u0005\u0012\u00030¶\u00010\u00022\t\b\u0001\u0010³\u0001\u001a\u00020\u00072\n\b\u0001\u0010\"\u001a\u0004\u0018\u00010\u00072\u000b\b\u0001\u0010´\u0001\u001a\u0004\u0018\u00010\u00072\u000b\b\u0001\u0010µ\u0001\u001a\u0004\u0018\u00010\u00072\b\b\u0001\u0010#\u001a\u00020\u0007H§@¢\u0006\u0005\b·\u0001\u0010jJ0\u0010»\u0001\u001a\t\u0012\u0005\u0012\u00030º\u00010\u00022\b\b\u0001\u0010d\u001a\u00020\u00072\n\b\u0001\u0010¹\u0001\u001a\u00030¸\u0001H§@¢\u0006\u0006\b»\u0001\u0010¼\u0001¨\u0006½\u0001À\u0006\u0003"}, d2 = {"Lcom/life360/android/l360networkkit/apis/MembersEngineNetworkApi;", "", "Lsuw;", "Lcom/life360/android/l360networkkit/apis/responses/UserResponse;", "getCurrentUser", "(Lcy7;)Ljava/lang/Object;", "", "", "params", "Lcom/life360/android/l360networkkit/apis/responses/UserAuthResponse;", "createUser", "(Ljava/util/Map;Lcy7;)Ljava/lang/Object;", "updateUser", "Lokhttp3/MultipartBody$Part;", "file", "nudge", "Lcom/life360/android/l360networkkit/apis/responses/UpdateUserAvatarResponse;", "updateUserAvatar", "(Lokhttp3/MultipartBody$Part;Lokhttp3/MultipartBody$Part;Lcy7;)Ljava/lang/Object;", "loginUser", "Lcom/life360/android/l360networkkit/apis/responses/LookupResponse;", "lookupUser", RegisterDeviceToUserRequest.KEY_APP_ID, "", "deleteUserAuthToken", "(Ljava/lang/String;Lcy7;)Ljava/lang/Object;", "deleteUser", "Ljava/lang/Void;", "sendSmsVerificationCode", "smsCode", "Lcom/life360/android/l360networkkit/apis/responses/PhoneValidationResponse;", "attemptPhoneValidation", "(Ljava/lang/String;Ljava/util/Map;Lcy7;)Ljava/lang/Object;", "registerDeviceToUser", "name", e04.KEY_TYPE, "inviteCodeExpiryHeader", "Lcom/life360/android/l360networkkit/apis/responses/CircleResponse;", "createCircle", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Lcy7;)Ljava/lang/Object;", "", "includeConfigurable", "Lcom/life360/android/l360networkkit/apis/responses/CircleListResponse;", "getCircles", "(Ljava/lang/Boolean;Lcy7;)Ljava/lang/Object;", "id", "updateCircle", "circleId", "code", "Lcom/life360/android/l360networkkit/apis/responses/JoinCircleResponse;", "joinCircle", "(Ljava/lang/String;Ljava/lang/String;Lcy7;)Ljava/lang/Object;", "joinCircleV6", "Lcom/life360/android/l360networkkit/apis/responses/MembersResponse;", "getCircleMembers", "", "Lcom/life360/android/l360networkkit/apis/responses/MemberRoleResponse;", "getCircleMembersRoles", "memberId", "removeCircleMember", "", "isAdmin", "updateMemberAdminStatus", "(Ljava/lang/String;Ljava/lang/String;ILcy7;)Ljava/lang/Object;", "Lcom/life360/android/l360networkkit/apis/request/UpdateMemberRoleRequestBody;", "body", "updateMemberRole", "(Ljava/lang/String;Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/UpdateMemberRoleRequestBody;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/l360networkkit/apis/responses/MembersDeviceStatesResponse;", "getCircleMemberDeviceStates", "Lcom/life360/android/l360networkkit/apis/responses/CirclesCodeResponse;", "createCircleCode", "Lcom/life360/android/l360networkkit/apis/responses/UpdateMemberAvatarResponse;", "updateMemberAvatar", "(Ljava/lang/String;Ljava/lang/String;Lokhttp3/MultipartBody$Part;Lokhttp3/MultipartBody$Part;Lcy7;)Ljava/lang/Object;", "adornedType", "adornedId", "Lcom/life360/android/l360networkkit/apis/responses/GetAdornmentsResponse3;", "getAdornmentsCeTypeV1", "Lcom/life360/android/l360networkkit/apis/responses/GetAdornmentsCeType3Response;", "getAdornmentsCeTypeV3", "ceType", "adornmentType", "adornmentId", "addAdornment", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Lcy7;)Ljava/lang/Object;", "adornType", "adornId", "removeAdornment", "activationStates", "Lcom/life360/android/l360networkkit/apis/responses/GetDevicesResponse3;", "getThirdPartyDevices3", "Lcom/life360/android/l360networkkit/apis/responses/GetCirclePhonesResponse;", "getCirclePhones", "Lcom/life360/android/l360networkkit/apis/responses/GetCircleDevicesIssuesResponse;", "getCircleDeviceIssues", "providers", "Lcom/life360/android/l360networkkit/apis/responses/GetCircleDeviceLocationsResponseWithState;", "getCircleDeviceLocationsWithState", "(Ljava/lang/String;Ljava/lang/String;Ljava/util/List;Lcy7;)Ljava/lang/Object;", Metrics.ARG_PROVIDER, "requestIntegrationUrl", "cacheControl", "state", "Lcom/life360/android/l360networkkit/apis/responses/ConfirmIntegrationResponse;", "confirmIntegration", "(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/l360networkkit/apis/responses/GetIntegrationsResponse;", "getIntegrations", "removeIntegration", "Lcom/life360/android/l360networkkit/apis/request/SignUpSendOtpRequest;", "Lcom/life360/android/l360networkkit/apis/responses/SignUpOtpSendResponse;", "signUpOtpSend", "(Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/SignUpSendOtpRequest;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/l360networkkit/apis/request/SignUpSendEmailOtpRequest;", "(Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/SignUpSendEmailOtpRequest;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/l360networkkit/apis/request/SignUpVerifyOtpRequest;", "signUpOtpVerify", "(Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/SignUpVerifyOtpRequest;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/l360networkkit/apis/request/CreateOtpUserRequest;", "Lcom/life360/android/l360networkkit/apis/responses/CreateOtpUserResponse;", "createOtpUser", "(Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/CreateOtpUserRequest;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/l360networkkit/apis/request/SignInSendOtpRequest$CountryCodeAndNumber;", "Lcom/life360/android/l360networkkit/apis/responses/SignInSendOtpResponse;", "signInOtpSend", "(Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/SignInSendOtpRequest$CountryCodeAndNumber;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/l360networkkit/apis/request/SignInSendOtpRequest$Email;", "(Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/SignInSendOtpRequest$Email;Lcy7;)Ljava/lang/Object;", "signInLegacyOtpSend", "Lcom/life360/android/l360networkkit/apis/request/SignInVerifyOtpRequest;", "Lcom/life360/android/l360networkkit/apis/responses/SignInOtpVerifyResponse;", "signInOtpVerify", "(Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/SignInVerifyOtpRequest;Lcy7;)Ljava/lang/Object;", "signInLegacyOtpVerify", "Lcom/life360/android/l360networkkit/apis/request/SignInRecoveryChallengeRequest;", "Lcom/life360/android/l360networkkit/apis/responses/SignInRecoveryChallengeResponse;", "signInRecoveryChallenge", "(Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/SignInRecoveryChallengeRequest;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/l360networkkit/apis/request/SignInRecoveryTokenRequest;", "signInRecoveryToken", "(Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/SignInRecoveryTokenRequest;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/l360networkkit/apis/request/SignUpClaimSendOtpRequest;", "Lcom/life360/android/l360networkkit/apis/responses/SignUpClaimSendOtpResponse;", "signUpOtpClaimSend", "(Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/SignUpClaimSendOtpRequest;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/l360networkkit/apis/request/SignUpClaimVerifyOtpRequest;", "signUpOtpClaimVerify", "(Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/SignUpClaimVerifyOtpRequest;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/l360networkkit/apis/request/SignInClaimSendOtpRequest$CountryCodeAndNumber;", "Lcom/life360/android/l360networkkit/apis/responses/OtpClaimSendResponse;", "otpClaimSend", "(Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/SignInClaimSendOtpRequest$CountryCodeAndNumber;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/l360networkkit/apis/request/SignInClaimSendOtpRequest$FullPhone;", "(Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/SignInClaimSendOtpRequest$FullPhone;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/l360networkkit/apis/request/SignInClaimSendOtpRequest$Email;", "(Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/SignInClaimSendOtpRequest$Email;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/l360networkkit/apis/request/ClaimVerifyOtpRequest;", "otpClaimVerify", "(Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/ClaimVerifyOtpRequest;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/l360networkkit/apis/request/ActivateTrackerBody;", "Lcom/life360/android/l360networkkit/apis/responses/ActivateTrackerResponse;", "activateTracker", "(Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/ActivateTrackerBody;Lcy7;)Ljava/lang/Object;", "deviceId", "Lcom/life360/android/l360networkkit/apis/responses/FinalizeActivationTrackerResponse;", "finalizeActivationTracker", "Lcom/life360/android/l360networkkit/apis/request/UpdateDeviceProfileRequestBody;", "Lcom/life360/android/l360networkkit/apis/responses/UpdateDeviceProfileResponse;", "updateDeviceProfile", "(Ljava/lang/String;Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/UpdateDeviceProfileRequestBody;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/l360networkkit/apis/responses/DeactivateTrackerResponse;", "deactivateTracker", "Lcom/life360/android/l360networkkit/apis/responses/FinalizeDeactivationTrackerResponse;", "finalizeDeactivationTracker", "Lcom/life360/android/l360networkkit/apis/request/ReportDeviceFirmwareVersionRequestBody;", "reportDeviceFirmwareVersion", "(Ljava/lang/String;Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/ReportDeviceFirmwareVersionRequestBody;Lcy7;)Ljava/lang/Object;", "reportBatteryReplaced", "uuid", "email", "phone", "Lcom/life360/android/l360networkkit/apis/responses/DsarResponse;", "sendDataSubjectAccessRequest", "Lcom/life360/android/l360networkkit/apis/request/AutoTileAccountCreationRequest;", "request", "Lcom/life360/android/l360networkkit/apis/responses/AutoTileAccountCreationResponse;", "autoCreateTileAccountAndLink", "(Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/AutoTileAccountCreationRequest;Lcy7;)Ljava/lang/Object;", "networkkit-l360"}, k = 1, mv = {2, 4, 0}, xi = 48)
public interface MembersEngineNetworkApi {

    /* JADX INFO: loaded from: classes5.dex */
    @Metadata(k = 3, mv = {2, 4, 0}, xi = 816)
    public static final class DefaultImpls {
    }

    static /* synthetic */ Object createCircle$default(MembersEngineNetworkApi membersEngineNetworkApi, String str, String str2, String str3, cy7 cy7Var, int i, Object obj) {
        if (obj != null) {
            i6.j("Super calls with default arguments not supported in this target, function: createCircle");
            return null;
        }
        if ((i & 4) != 0) {
            str3 = null;
        }
        return membersEngineNetworkApi.createCircle(str, str2, str3, cy7Var);
    }

    @nwr("/v6/provider/{provider}/devices/activate")
    @lyh({"ce-type: com.life360.provider.device.activate.v1"})
    Object activateTracker(@hds(Metrics.ARG_PROVIDER) String str, @hs3 ActivateTrackerBody activateTrackerBody, cy7<? super suw<ActivateTrackerResponse>> cy7Var);

    @g1s("/v6/adornments/{adornedType}/{adornedId}/{adornmentType}/{adornmentId}")
    Object addAdornment(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @ayh("circleid") String str2, @hds("adornedType") String str3, @hds("adornedId") String str4, @hds("adornmentType") String str5, @hds("adornmentId") String str6, cy7<? super suw<Unit>> cy7Var);

    @g1s("/v3/users/attemptValidationPhone/{smsCode}")
    @x4g
    Object attemptPhoneValidation(@hds("smsCode") String str, @fye Map<String, String> map, cy7<? super suw<PhoneValidationResponse>> cy7Var);

    @nwr("/v6/integrations/auto/{provider}")
    @lyh({"ce-type: com.life360.cloud.integrations.auto.v1"})
    Object autoCreateTileAccountAndLink(@hds(Metrics.ARG_PROVIDER) String str, @hs3 AutoTileAccountCreationRequest autoTileAccountCreationRequest, cy7<? super suw<AutoTileAccountCreationResponse>> cy7Var);

    @nwr("/v6/integrations/link/{provider}")
    Object confirmIntegration(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @ayh("Cache-Control") String str2, @hds(Metrics.ARG_PROVIDER) String str3, @ptv("code") String str4, @ptv(encoded = true, value = "state") String str5, cy7<? super suw<ConfirmIntegrationResponse>> cy7Var);

    @nwr("/v3/circles")
    @x4g
    Object createCircle(@xxe("name") String str, @xxe(e04.KEY_TYPE) String str2, @ayh("X-EXPERIMENT-INVITE-CODE") String str3, cy7<? super suw<CircleResponse>> cy7Var);

    @nwr("/v3/circles/{circleId}/code")
    Object createCircleCode(@hds("circleId") String str, cy7<? super suw<CirclesCodeResponse>> cy7Var);

    @nwr("/v5/users")
    Object createOtpUser(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hs3 CreateOtpUserRequest createOtpUserRequest, cy7<? super suw<CreateOtpUserResponse>> cy7Var);

    @nwr("/v3/users")
    @x4g
    Object createUser(@fye Map<String, String> map, cy7<? super suw<UserAuthResponse>> cy7Var);

    @nwr("/v6/provider/{provider}/devices/{deviceId}/deactivate")
    @lyh({"ce-type: com.life360.provider.device.deactivate.v1"})
    Object deactivateTracker(@hds(Metrics.ARG_PROVIDER) String str, @hds("deviceId") String str2, cy7<? super suw<DeactivateTrackerResponse>> cy7Var);

    @h09("/v3/users")
    Object deleteUser(cy7<? super suw<Unit>> cy7Var);

    @h09("/v3/oauth2/token")
    Object deleteUserAuthToken(@ptv(RegisterDeviceToUserRequest.KEY_APP_ID) String str, cy7<? super suw<Unit>> cy7Var);

    @nwr("/v6/provider/{provider}/devices/{deviceId}/finalizeActivation")
    @lyh({"ce-type: com.life360.provider.device.finalizeActivation.v1"})
    Object finalizeActivationTracker(@hds(Metrics.ARG_PROVIDER) String str, @hds("deviceId") String str2, cy7<? super suw<FinalizeActivationTrackerResponse>> cy7Var);

    @nwr("/v6/provider/{provider}/devices/{deviceId}/finalizeDeactivation")
    @lyh({"ce-type: com.life360.provider.device.finalizeDeactivation.v1"})
    Object finalizeDeactivationTracker(@hds(Metrics.ARG_PROVIDER) String str, @hds("deviceId") String str2, cy7<? super suw<FinalizeDeactivationTrackerResponse>> cy7Var);

    @jng("/v6/adornments/{adornedType}/{adornedId}")
    @lyh({"ce-type: com.life360.cloud.adornments.v1"})
    Object getAdornmentsCeTypeV1(@ayh("circleid") String str, @hds("adornedType") String str2, @hds("adornedId") String str3, cy7<? super suw<GetAdornmentsResponse3>> cy7Var);

    @jng("/v6/adornments/{adornedType}/{adornedId}")
    @lyh({"ce-type: com.life360.cloud.adornments.v3"})
    Object getAdornmentsCeTypeV3(@ayh("circleid") String str, @hds("adornedType") String str2, @hds("adornedId") String str3, cy7<? super suw<GetAdornmentsCeType3Response>> cy7Var);

    @jng("/v5/circles/devices/issues")
    Object getCircleDeviceIssues(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @ayh("circleid") String str2, cy7<? super suw<GetCircleDevicesIssuesResponse>> cy7Var);

    @jng("/v5/circles/devices/locations")
    Object getCircleDeviceLocationsWithState(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @ayh("circleid") String str2, @ptv(encoded = true, value = "providers[]") List<String> list, cy7<? super suw<GetCircleDeviceLocationsResponseWithState>> cy7Var);

    @jng("/v4/circles/{circleId}/members/devices")
    Object getCircleMemberDeviceStates(@hds("circleId") String str, cy7<? super suw<MembersDeviceStatesResponse>> cy7Var);

    @jng("/v4/circles/{circleId}/members")
    Object getCircleMembers(@hds("circleId") String str, cy7<? super suw<MembersResponse>> cy7Var);

    @jng("/v5/circles/{circleId}/members/roles")
    Object getCircleMembersRoles(@hds("circleId") String str, cy7<? super suw<List<MemberRoleResponse>>> cy7Var);

    @jng("/v5/circles/devices")
    Object getCirclePhones(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @ayh("circleid") String str2, cy7<? super suw<GetCirclePhonesResponse>> cy7Var);

    @jng("/v4/circles")
    Object getCircles(@ptv("includeConfigurable") Boolean bool, cy7<? super suw<CircleListResponse>> cy7Var);

    @jng("/v3/users/me")
    Object getCurrentUser(cy7<? super suw<UserResponse>> cy7Var);

    @jng("/v6/integrations")
    Object getIntegrations(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, cy7<? super suw<GetIntegrationsResponse>> cy7Var);

    @jng("/v6/devices")
    @lyh({"ce-type: com.life360.device.devices.v1"})
    Object getThirdPartyDevices3(@ptv("activationStates") String str, cy7<? super suw<GetDevicesResponse3>> cy7Var);

    @g1s("/v4/circles/{circleId}/code/{code}")
    Object joinCircle(@hds("circleId") String str, @hds("code") String str2, cy7<? super suw<JoinCircleResponse>> cy7Var);

    @g1s("/v6/circles/{circleId}/code/{code}")
    Object joinCircleV6(@hds("circleId") String str, @hds("code") String str2, cy7<? super suw<JoinCircleResponse>> cy7Var);

    @nwr("/v3/oauth2/token")
    @x4g
    Object loginUser(@fye Map<String, String> map, cy7<? super suw<UserAuthResponse>> cy7Var);

    @jng("/v3/users/lookup")
    Object lookupUser(@rtv Map<String, String> map, cy7<? super suw<LookupResponse>> cy7Var);

    @nwr("/v5/users/otp/claim/send")
    Object otpClaimSend(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hs3 SignInClaimSendOtpRequest.CountryCodeAndNumber countryCodeAndNumber, cy7<? super suw<OtpClaimSendResponse>> cy7Var);

    @nwr("/v5/users/otp/claim/send")
    Object otpClaimSend(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hs3 SignInClaimSendOtpRequest.Email email, cy7<? super suw<OtpClaimSendResponse>> cy7Var);

    @nwr("/v5/users/otp/claim/send")
    Object otpClaimSend(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hs3 SignInClaimSendOtpRequest.FullPhone fullPhone, cy7<? super suw<OtpClaimSendResponse>> cy7Var);

    @nwr("/v5/users/otp/claim/verify")
    Object otpClaimVerify(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hs3 ClaimVerifyOtpRequest claimVerifyOtpRequest, cy7<? super suw<Unit>> cy7Var);

    @nwr("/v3/users/devices")
    @x4g
    Object registerDeviceToUser(@fye Map<String, String> map, cy7<? super suw<Unit>> cy7Var);

    @h09("/v6/adornments/{adornedType}/{adornedId}/{adornmentType}/{adornmentId}")
    Object removeAdornment(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @ayh("circleid") String str2, @hds("adornedType") String str3, @hds("adornedId") String str4, @hds("adornmentType") String str5, @hds("adornmentId") String str6, cy7<? super suw<Unit>> cy7Var);

    @h09("/v3/circles/{circleId}/members/{memberId}")
    Object removeCircleMember(@hds("circleId") String str, @hds("memberId") String str2, cy7<? super suw<Unit>> cy7Var);

    @h09("/v6/integrations/{id}")
    Object removeIntegration(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hds("id") String str2, cy7<? super suw<Unit>> cy7Var);

    @nwr("/v6/provider/{provider}/devices/{deviceId}/batteryReplaced")
    @lyh({"ce-type: com.life360.provider.device.batteryReplaced.v1"})
    Object reportBatteryReplaced(@hds(Metrics.ARG_PROVIDER) String str, @hds("deviceId") String str2, cy7<? super suw<Unit>> cy7Var);

    @g1s("/v6/provider/{provider}/devices/{deviceId}/fw")
    @lyh({"ce-type: com.life360.provider.device.reportFirmware.v1"})
    Object reportDeviceFirmwareVersion(@hds(Metrics.ARG_PROVIDER) String str, @hds("deviceId") String str2, @hs3 ReportDeviceFirmwareVersionRequestBody reportDeviceFirmwareVersionRequestBody, cy7<? super suw<Unit>> cy7Var);

    @jng("/v6/integrations/start/{provider}")
    Object requestIntegrationUrl(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hds(Metrics.ARG_PROVIDER) String str2, cy7<? super suw<Unit>> cy7Var);

    @nwr("/v3/dsar")
    @x4g
    Object sendDataSubjectAccessRequest(@xxe("uuid") String str, @xxe("name") String str2, @xxe("email") String str3, @xxe("phone") String str4, @xxe(e04.KEY_TYPE) String str5, cy7<? super suw<DsarResponse>> cy7Var);

    @nwr("/v3/users/sendValidationSms")
    @x4g
    Object sendSmsVerificationCode(@fye Map<String, String> map, cy7<? super suw<Void>> cy7Var);

    @nwr("/v5/users/signin/legacy/otp/send")
    Object signInLegacyOtpSend(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hs3 SignInSendOtpRequest.CountryCodeAndNumber countryCodeAndNumber, cy7<? super suw<SignInSendOtpResponse>> cy7Var);

    @nwr("/v5/users/signin/legacy/otp/token")
    Object signInLegacyOtpVerify(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hs3 SignInVerifyOtpRequest signInVerifyOtpRequest, cy7<? super suw<SignInOtpVerifyResponse>> cy7Var);

    @nwr("/v5/users/signin/otp/send")
    Object signInOtpSend(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hs3 SignInSendOtpRequest.CountryCodeAndNumber countryCodeAndNumber, cy7<? super suw<SignInSendOtpResponse>> cy7Var);

    @nwr("/v5/users/signin/otp/send")
    Object signInOtpSend(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hs3 SignInSendOtpRequest.Email email, cy7<? super suw<SignInSendOtpResponse>> cy7Var);

    @nwr("/v5/users/signin/otp/token")
    Object signInOtpVerify(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hs3 SignInVerifyOtpRequest signInVerifyOtpRequest, cy7<? super suw<SignInOtpVerifyResponse>> cy7Var);

    @nwr("/v5/users/signin/recovery/challenge")
    Object signInRecoveryChallenge(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hs3 SignInRecoveryChallengeRequest signInRecoveryChallengeRequest, cy7<? super suw<SignInRecoveryChallengeResponse>> cy7Var);

    @nwr("/v5/users/signin/recovery/token")
    Object signInRecoveryToken(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hs3 SignInRecoveryTokenRequest signInRecoveryTokenRequest, cy7<? super suw<SignInOtpVerifyResponse>> cy7Var);

    @nwr("/v5/users/signup/otp/claim/send")
    Object signUpOtpClaimSend(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hs3 SignUpClaimSendOtpRequest signUpClaimSendOtpRequest, cy7<? super suw<SignUpClaimSendOtpResponse>> cy7Var);

    @nwr("/v5/users/signup/otp/claim/verify")
    Object signUpOtpClaimVerify(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hs3 SignUpClaimVerifyOtpRequest signUpClaimVerifyOtpRequest, cy7<? super suw<Unit>> cy7Var);

    @nwr("/v5/users/signup/otp/send")
    Object signUpOtpSend(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hs3 SignUpSendEmailOtpRequest signUpSendEmailOtpRequest, cy7<? super suw<SignUpOtpSendResponse>> cy7Var);

    @nwr("/v5/users/signup/otp/send")
    Object signUpOtpSend(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hs3 SignUpSendOtpRequest signUpSendOtpRequest, cy7<? super suw<SignUpOtpSendResponse>> cy7Var);

    @nwr("/v5/users/signup/otp/verify")
    Object signUpOtpVerify(@ayh(CloudEventHeaderInterceptor.HEADER_CE_TYPE) String str, @hs3 SignUpVerifyOtpRequest signUpVerifyOtpRequest, cy7<? super suw<Unit>> cy7Var);

    @g1s("/v3/circles/{id}")
    @x4g
    Object updateCircle(@hds("id") String str, @xxe("name") String str2, @xxe(e04.KEY_TYPE) String str3, cy7<? super suw<CircleResponse>> cy7Var);

    @nwr("/v6/provider/{provider}/devices/{deviceId}/updateProfile")
    @lyh({"ce-type: com.life360.provider.device.updateProfile.v1"})
    Object updateDeviceProfile(@hds(Metrics.ARG_PROVIDER) String str, @hds("deviceId") String str2, @hs3 UpdateDeviceProfileRequestBody updateDeviceProfileRequestBody, cy7<? super suw<UpdateDeviceProfileResponse>> cy7Var);

    @g1s("/v3/circles/{circleId}/members/{memberId}/permissions")
    @x4g
    Object updateMemberAdminStatus(@hds("circleId") String str, @hds("memberId") String str2, @xxe("isAdmin") int i, cy7<? super suw<Unit>> cy7Var);

    @nwr("/v3/circles/{circleId}/members/{memberId}/avatar")
    @nwp
    Object updateMemberAvatar(@hds("circleId") String str, @hds("memberId") String str2, @p7s MultipartBody.Part part, @p7s MultipartBody.Part part2, cy7<? super suw<UpdateMemberAvatarResponse>> cy7Var);

    @g1s("/v5/circles/{circleId}/members/{memberId}/role")
    @lyh({"ce-type: com.life360.device.member-role.v1"})
    Object updateMemberRole(@hds("circleId") String str, @hds("memberId") String str2, @hs3 UpdateMemberRoleRequestBody updateMemberRoleRequestBody, cy7<? super suw<Unit>> cy7Var);

    @g1s("/v3/users")
    @x4g
    Object updateUser(@fye Map<String, String> map, cy7<? super suw<UserResponse>> cy7Var);

    @nwr("/v3/users/avatar")
    @nwp
    Object updateUserAvatar(@p7s MultipartBody.Part part, @p7s MultipartBody.Part part2, cy7<? super suw<UpdateUserAvatarResponse>> cy7Var);
}
