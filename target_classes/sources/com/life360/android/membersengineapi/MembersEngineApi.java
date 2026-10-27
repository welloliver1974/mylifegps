package com.life360.android.membersengineapi;

import com.life360.android.membersengine.device_setting.DeviceSettingWireKt;
import com.life360.android.membersengineapi.models.circle.CreateCircleCodeQuery;
import com.life360.android.membersengineapi.models.circle.CreateCircleQuery;
import com.life360.android.membersengineapi.models.circle.JoinCircleQuery;
import com.life360.android.membersengineapi.models.circle.SwitchActiveCircleQuery;
import com.life360.android.membersengineapi.models.circle.UpdateCircleQuery;
import com.life360.android.membersengineapi.models.current_user.CreateOtpUserQuery;
import com.life360.android.membersengineapi.models.current_user.CreateUserQuery;
import com.life360.android.membersengineapi.models.current_user.LoginWithEmailQuery;
import com.life360.android.membersengineapi.models.current_user.LoginWithPhoneQuery;
import com.life360.android.membersengineapi.models.current_user.LogoutCurrentUserQuery;
import com.life360.android.membersengineapi.models.current_user.LookupUserQuery;
import com.life360.android.membersengineapi.models.current_user.RegisterDeviceToUserQuery;
import com.life360.android.membersengineapi.models.current_user.SmsVerificationCodeQuery;
import com.life360.android.membersengineapi.models.current_user.UpdateCurrentUserAvatarQuery;
import com.life360.android.membersengineapi.models.current_user.UpdateCurrentUserQuery;
import com.life360.android.membersengineapi.models.current_user.ValidatePhoneNumberQuery;
import com.life360.android.membersengineapi.models.device.ActivateTileQuery;
import com.life360.android.membersengineapi.models.device.AddDevicesQuery;
import com.life360.android.membersengineapi.models.device.AssociateTileQuery;
import com.life360.android.membersengineapi.models.device.DeactivateTileQuery;
import com.life360.android.membersengineapi.models.device.GetDevicesQuery;
import com.life360.android.membersengineapi.models.device.RemoveDevicesQuery;
import com.life360.android.membersengineapi.models.device.ReportBatteryReplacedQuery;
import com.life360.android.membersengineapi.models.device.ReportDeviceFirmwareVersionQuery;
import com.life360.android.membersengineapi.models.device.TileActivationState;
import com.life360.android.membersengineapi.models.device.UpdateTileProfileQuery;
import com.life360.android.membersengineapi.models.device_setting.DeviceSetting;
import com.life360.android.membersengineapi.models.device_setting.GetDeviceSettingsQuery;
import com.life360.android.membersengineapi.models.device_setting.SaveDeviceSettingsQuery;
import com.life360.android.membersengineapi.models.device_state.DeviceStatesQuery;
import com.life360.android.membersengineapi.models.dsar.DsarQuery;
import com.life360.android.membersengineapi.models.integration.AutoTileAccountCreationAndLinkingQuery;
import com.life360.android.membersengineapi.models.integration.ConfirmIntegrationQuery;
import com.life360.android.membersengineapi.models.integration.GetIntegrationsQuery;
import com.life360.android.membersengineapi.models.integration.RemoveIntegrationQuery;
import com.life360.android.membersengineapi.models.integration.RequestIntegrationUrlQuery;
import com.life360.android.membersengineapi.models.member.GetMemberByIdQuery;
import com.life360.android.membersengineapi.models.member.GetMembersQuery;
import com.life360.android.membersengineapi.models.member.RemoveMemberQuery;
import com.life360.android.membersengineapi.models.member.UpdateMemberAdminStatusQuery;
import com.life360.android.membersengineapi.models.member.UpdateMemberAvatarQuery;
import com.life360.android.membersengineapi.models.member.UpdateMemberRoleQuery;
import com.life360.android.membersengineapi.models.one_time_password.OtpSendQuery;
import com.life360.android.membersengineapi.models.one_time_password.OtpVerifyQuery;
import com.life360.android.membersengineapi.models.one_time_password.SignInRecoveryChallengeQuery;
import com.life360.android.membersengineapi.models.profile.CreateProfileQuery;
import com.life360.android.membersengineapi.models.profile.DeleteProfileQuery;
import com.life360.android.membersengineapi.models.profile.GetProfileQuery;
import com.life360.android.membersengineapi.models.profile.GetProfilesAndDevicesQuery;
import com.life360.android.membersengineapi.models.profile.GetProfilesQuery;
import com.life360.android.membersengineapi.models.profile.LinkDeviceToProfileQuery;
import com.life360.android.membersengineapi.models.profile.UpdateProfileQuery;
import com.life360.android.membersengineapi.models.profile.UploadPetProfileAvatarQuery;
import defpackage.cy7;
import defpackage.ia20;
import defpackage.lkf;
import defpackage.opa;
import defpackage.svw;
import defpackage.w920;
import defpackage.y500;
import io.sentry.i6;
import java.util.List;
import java.util.Set;
import kotlin.Metadata;
import kotlin.Unit;

/* JADX INFO: loaded from: classes2.dex */
@Metadata(d1 = {"\u0000Ì\u0004\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\u0010\u0002\n\u0002\b\u0005\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\t\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0007\n\u0002\u0010\u000e\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\t\n\u0002\b\u0004\n\u0002\u0010\"\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\r\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0007\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\b\b\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0016\bf\u0018\u00002\u00020\u0001J\u000f\u0010\u0003\u001a\u00020\u0002H&¢\u0006\u0004\b\u0003\u0010\u0004J\u000f\u0010\u0005\u001a\u00020\u0002H&¢\u0006\u0004\b\u0005\u0010\u0004J\u000f\u0010\u0006\u001a\u00020\u0002H&¢\u0006\u0004\b\u0006\u0010\u0004J\u000f\u0010\u0007\u001a\u00020\u0002H&¢\u0006\u0004\b\u0007\u0010\u0004J \u0010\u000e\u001a\b\u0012\u0004\u0012\u00020\u000b0\n2\b\b\u0002\u0010\t\u001a\u00020\bH¦@¢\u0006\u0004\b\f\u0010\rJ\u001e\u0010\u0013\u001a\b\u0012\u0004\u0012\u00020\u000b0\n2\u0006\u0010\u0010\u001a\u00020\u000fH¦@¢\u0006\u0004\b\u0011\u0010\u0012J\u001e\u0010\u0013\u001a\b\u0012\u0004\u0012\u00020\u000b0\n2\u0006\u0010\u0010\u001a\u00020\u0014H¦@¢\u0006\u0004\b\u0011\u0010\u0015J\u001e\u0010\u001a\u001a\b\u0012\u0004\u0012\u00020\u000b0\n2\u0006\u0010\u0017\u001a\u00020\u0016H¦@¢\u0006\u0004\b\u0018\u0010\u0019J\u001e\u0010\u001f\u001a\b\u0012\u0004\u0012\u00020\u000b0\n2\u0006\u0010\u001c\u001a\u00020\u001bH¦@¢\u0006\u0004\b\u001d\u0010\u001eJ\u001e\u0010%\u001a\b\u0012\u0004\u0012\u00020\"0\n2\u0006\u0010!\u001a\u00020 H¦@¢\u0006\u0004\b#\u0010$J\u001e\u0010*\u001a\b\u0012\u0004\u0012\u00020\u000b0\n2\u0006\u0010'\u001a\u00020&H¦@¢\u0006\u0004\b(\u0010)J\u001e\u0010/\u001a\b\u0012\u0004\u0012\u00020\u000b0\n2\u0006\u0010,\u001a\u00020+H¦@¢\u0006\u0004\b-\u0010.J\u0016\u00102\u001a\b\u0012\u0004\u0012\u00020\u000b0\nH¦@¢\u0006\u0004\b0\u00101J\u0016\u00104\u001a\b\u0012\u0004\u0012\u00020\u00020\nH¦@¢\u0006\u0004\b3\u00101J\u001e\u00109\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\u0006\u00106\u001a\u000205H¦@¢\u0006\u0004\b7\u00108J\u001e\u0010?\u001a\b\u0012\u0004\u0012\u00020<0\n2\u0006\u0010;\u001a\u00020:H¦@¢\u0006\u0004\b=\u0010>J\u001e\u0010D\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\u0006\u0010A\u001a\u00020@H¦@¢\u0006\u0004\bB\u0010CJ&\u0010K\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020H0G0\n2\b\b\u0002\u0010F\u001a\u00020EH¦@¢\u0006\u0004\bI\u0010JJ\u0016\u0010M\u001a\b\u0012\u0004\u0012\u00020H0\nH¦@¢\u0006\u0004\bL\u00101J\u001e\u0010R\u001a\b\u0012\u0004\u0012\u00020H0\n2\u0006\u0010O\u001a\u00020NH¦@¢\u0006\u0004\bP\u0010QJ\u001e\u0010W\u001a\b\u0012\u0004\u0012\u00020H0\n2\u0006\u0010T\u001a\u00020SH¦@¢\u0006\u0004\bU\u0010VJ\u001e\u0010\\\u001a\b\u0012\u0004\u0012\u00020H0\n2\u0006\u0010Y\u001a\u00020XH¦@¢\u0006\u0004\bZ\u0010[J\u001e\u0010a\u001a\b\u0012\u0004\u0012\u00020H0\n2\u0006\u0010^\u001a\u00020]H¦@¢\u0006\u0004\b_\u0010`J\u001e\u0010g\u001a\b\u0012\u0004\u0012\u00020d0\n2\u0006\u0010c\u001a\u00020bH¦@¢\u0006\u0004\be\u0010fJ\u001c\u0010j\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020h0G0\nH¦@¢\u0006\u0004\bi\u00101J$\u0010o\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020h0G0\n2\u0006\u0010l\u001a\u00020kH¦@¢\u0006\u0004\bm\u0010nJ#\u0010q\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020h0G0p2\u0006\u0010l\u001a\u00020kH&¢\u0006\u0004\bq\u0010rJ\u001e\u0010w\u001a\b\u0012\u0004\u0012\u00020h0\n2\u0006\u0010t\u001a\u00020sH§@¢\u0006\u0004\bu\u0010vJ\u001e\u0010|\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\u0006\u0010y\u001a\u00020xH¦@¢\u0006\u0004\bz\u0010{J \u0010\u0081\u0001\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\u0006\u0010~\u001a\u00020}H¦@¢\u0006\u0005\b\u007f\u0010\u0080\u0001J#\u0010\u0086\u0001\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\b\u0010\u0083\u0001\u001a\u00030\u0082\u0001H¦@¢\u0006\u0006\b\u0084\u0001\u0010\u0085\u0001J#\u0010\u008a\u0001\u001a\u00020\u00022\u000f\u0010\u0089\u0001\u001a\n\u0012\u0005\u0012\u00030\u0088\u00010\u0087\u0001H&¢\u0006\u0006\b\u008a\u0001\u0010\u008b\u0001J\u001e\u0010\u008d\u0001\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020H0G0\nH¦@¢\u0006\u0005\b\u008c\u0001\u00101J&\u0010\u008f\u0001\u001a\u000e\u0012\n\u0012\b\u0012\u0004\u0012\u00020h0G0\n2\u0006\u0010l\u001a\u00020kH¦@¢\u0006\u0005\b\u008e\u0001\u0010nJ\u0013\u0010\u0091\u0001\u001a\u00030\u0090\u0001H&¢\u0006\u0006\b\u0091\u0001\u0010\u0092\u0001J#\u0010\u0097\u0001\u001a\b\u0012\u0004\u0012\u00020h0\n2\b\u0010\u0094\u0001\u001a\u00030\u0093\u0001H¦@¢\u0006\u0006\b\u0095\u0001\u0010\u0096\u0001J$\u0010\u009d\u0001\u001a\t\u0012\u0005\u0012\u00030\u009a\u00010\n2\b\u0010\u0099\u0001\u001a\u00030\u0098\u0001H¦@¢\u0006\u0006\b\u009b\u0001\u0010\u009c\u0001J$\u0010¡\u0001\u001a\t\u0012\u0005\u0012\u00030\u0090\u00010\n2\b\u0010\u0099\u0001\u001a\u00030\u009e\u0001H¦@¢\u0006\u0006\b\u009f\u0001\u0010 \u0001J$\u0010¦\u0001\u001a\t\u0012\u0005\u0012\u00030£\u00010\n2\b\u0010\u0099\u0001\u001a\u00030¢\u0001H¦@¢\u0006\u0006\b¤\u0001\u0010¥\u0001J#\u0010ª\u0001\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\b\u0010\u0099\u0001\u001a\u00030§\u0001H¦@¢\u0006\u0006\b¨\u0001\u0010©\u0001J*\u0010®\u0001\u001a\u000f\u0012\u000b\u0012\t\u0012\u0005\u0012\u00030£\u00010G0\n2\b\u0010\u0099\u0001\u001a\u00030«\u0001H¦@¢\u0006\u0006\b¬\u0001\u0010\u00ad\u0001J#\u0010²\u0001\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\b\u0010\u0099\u0001\u001a\u00030¯\u0001H¦@¢\u0006\u0006\b°\u0001\u0010±\u0001J#\u0010¶\u0001\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\b\u0010\u0099\u0001\u001a\u00030³\u0001H¦@¢\u0006\u0006\b´\u0001\u0010µ\u0001J4\u0010»\u0001\u001a\u000f\u0012\u000b\u0012\t\u0012\u0005\u0012\u00030¸\u00010G0\n2\b\u0010\u0099\u0001\u001a\u00030·\u00012\b\b\u0002\u0010\t\u001a\u00020\bH¦@¢\u0006\u0006\b¹\u0001\u0010º\u0001J4\u0010À\u0001\u001a\u000f\u0012\u000b\u0012\t\u0012\u0005\u0012\u00030½\u00010G0\n2\b\u0010\u0099\u0001\u001a\u00030¼\u00012\b\b\u0002\u0010\t\u001a\u00020\bH¦@¢\u0006\u0006\b¾\u0001\u0010¿\u0001J*\u0010Ä\u0001\u001a\u000f\u0012\u000b\u0012\t\u0012\u0005\u0012\u00030½\u00010G0\n2\b\u0010\u0099\u0001\u001a\u00030Á\u0001H¦@¢\u0006\u0006\bÂ\u0001\u0010Ã\u0001J<\u0010Ë\u0001\u001a\u00020\u00022\b\u0010Å\u0001\u001a\u00030\u0090\u00012\b\u0010Ç\u0001\u001a\u00030Æ\u00012\b\u0010É\u0001\u001a\u00030È\u00012\t\b\u0002\u0010Ê\u0001\u001a\u00020\bH¦@¢\u0006\u0006\bË\u0001\u0010Ì\u0001J0\u0010Ð\u0001\u001a\u000f\u0012\u000b\u0012\t\u0012\u0005\u0012\u00030¸\u00010G0p2\u000f\u0010Ï\u0001\u001a\n\u0012\u0005\u0012\u00030Î\u00010Í\u0001H&¢\u0006\u0006\bÐ\u0001\u0010Ñ\u0001J4\u0010Ö\u0001\u001a\u000f\u0012\u000b\u0012\t\u0012\u0005\u0012\u00030Ó\u00010G0\n2\b\u0010\u0099\u0001\u001a\u00030Ò\u00012\b\b\u0002\u0010\t\u001a\u00020\bH¦@¢\u0006\u0006\bÔ\u0001\u0010Õ\u0001J>\u0010Ú\u0001\u001a\u000f\u0012\u000b\u0012\t\u0012\u0005\u0012\u00030Ó\u00010G0\n2\b\u0010×\u0001\u001a\u00030\u0090\u00012\b\u0010\u0099\u0001\u001a\u00030Ò\u00012\b\b\u0002\u0010\t\u001a\u00020\bH¦@¢\u0006\u0006\bØ\u0001\u0010Ù\u0001J;\u0010Ý\u0001\u001a\u000f\u0012\u000b\u0012\t\u0012\u0005\u0012\u00030Ó\u00010G0p2\u000e\u0010Û\u0001\u001a\t\u0012\u0005\u0012\u00030\u0090\u00010G2\t\b\u0002\u0010Ü\u0001\u001a\u00020\bH¦@¢\u0006\u0006\bÝ\u0001\u0010Þ\u0001J0\u0010ß\u0001\u001a\u000f\u0012\u000b\u0012\t\u0012\u0005\u0012\u00030Ó\u00010G0p2\u000e\u0010Û\u0001\u001a\t\u0012\u0005\u0012\u00030\u0090\u00010GH¦@¢\u0006\u0006\bß\u0001\u0010à\u0001J$\u0010å\u0001\u001a\t\u0012\u0005\u0012\u00030â\u00010\n2\b\u0010\u0099\u0001\u001a\u00030á\u0001H¦@¢\u0006\u0006\bã\u0001\u0010ä\u0001J#\u0010é\u0001\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\b\u0010\u0099\u0001\u001a\u00030æ\u0001H¦@¢\u0006\u0006\bç\u0001\u0010è\u0001J$\u0010î\u0001\u001a\t\u0012\u0005\u0012\u00030ë\u00010\n2\b\u0010\u0099\u0001\u001a\u00030ê\u0001H¦@¢\u0006\u0006\bì\u0001\u0010í\u0001J$\u0010ó\u0001\u001a\t\u0012\u0005\u0012\u00030ð\u00010\n2\b\u0010\u0099\u0001\u001a\u00030ï\u0001H¦@¢\u0006\u0006\bñ\u0001\u0010ò\u0001J#\u0010÷\u0001\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\b\u0010\u0099\u0001\u001a\u00030ô\u0001H¦@¢\u0006\u0006\bõ\u0001\u0010ö\u0001J#\u0010ù\u0001\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\b\u0010\u0099\u0001\u001a\u00030ô\u0001H¦@¢\u0006\u0006\bø\u0001\u0010ö\u0001J#\u0010ý\u0001\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\b\u0010\u0099\u0001\u001a\u00030ú\u0001H¦@¢\u0006\u0006\bû\u0001\u0010ü\u0001J#\u0010\u0081\u0002\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\b\u0010\u0099\u0001\u001a\u00030þ\u0001H¦@¢\u0006\u0006\bÿ\u0001\u0010\u0080\u0002J\u001c\u0010\u0082\u0002\u001a\u00020\b2\b\u0010Å\u0001\u001a\u00030\u0090\u0001H&¢\u0006\u0006\b\u0082\u0002\u0010\u0083\u0002J#\u0010\u0087\u0002\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\b\u0010\u0099\u0001\u001a\u00030\u0084\u0002H¦@¢\u0006\u0006\b\u0085\u0002\u0010\u0086\u0002J#\u0010\u008b\u0002\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\b\u0010\u0099\u0001\u001a\u00030\u0088\u0002H¦@¢\u0006\u0006\b\u0089\u0002\u0010\u008a\u0002J$\u0010\u0090\u0002\u001a\t\u0012\u0005\u0012\u00030\u008d\u00020\n2\b\u0010\u0099\u0001\u001a\u00030\u008c\u0002H¦@¢\u0006\u0006\b\u008e\u0002\u0010\u008f\u0002J\u0012\u0010\u0091\u0002\u001a\u00020\bH&¢\u0006\u0006\b\u0091\u0002\u0010\u0092\u0002J\"\u0010\u0093\u0002\u001a\u00020\u00022\u000e\u0010Û\u0001\u001a\t\u0012\u0005\u0012\u00030\u0090\u00010GH&¢\u0006\u0006\b\u0093\u0002\u0010\u0094\u0002J)\u0010\u0097\u0002\u001a\u000f\u0012\u000b\u0012\t\u0012\u0005\u0012\u00030\u0096\u00020G0p2\b\u0010\u0099\u0001\u001a\u00030\u0095\u0002H&¢\u0006\u0006\b\u0097\u0002\u0010\u0098\u0002J*\u0010\u009b\u0002\u001a\u000f\u0012\u000b\u0012\t\u0012\u0005\u0012\u00030\u0096\u00020G0\n2\b\u0010\u0099\u0001\u001a\u00030\u0095\u0002H¦@¢\u0006\u0006\b\u0099\u0002\u0010\u009a\u0002J)\u0010\u009e\u0002\u001a\u000f\u0012\u000b\u0012\t\u0012\u0005\u0012\u00030\u009d\u00020G0p2\b\u0010\u0099\u0001\u001a\u00030\u009c\u0002H&¢\u0006\u0006\b\u009e\u0002\u0010\u009f\u0002J%\u0010¡\u0002\u001a\u000b\u0012\u0007\u0012\u0005\u0018\u00010\u009d\u00020p2\b\u0010\u0099\u0001\u001a\u00030 \u0002H&¢\u0006\u0006\b¡\u0002\u0010¢\u0002J.\u0010¥\u0002\u001a\t\u0012\u0005\u0012\u00030\u009d\u00020\n2\b\u0010\u0099\u0001\u001a\u00030 \u00022\b\b\u0002\u0010\t\u001a\u00020\bH¦@¢\u0006\u0006\b£\u0002\u0010¤\u0002J4\u0010¨\u0002\u001a\u000f\u0012\u000b\u0012\t\u0012\u0005\u0012\u00030\u009d\u00020G0\n2\b\u0010\u0099\u0001\u001a\u00030\u009c\u00022\b\b\u0002\u0010\t\u001a\u00020\bH¦@¢\u0006\u0006\b¦\u0002\u0010§\u0002J$\u0010¬\u0002\u001a\t\u0012\u0005\u0012\u00030\u009d\u00020\n2\b\u0010\u0099\u0001\u001a\u00030©\u0002H¦@¢\u0006\u0006\bª\u0002\u0010«\u0002J#\u0010°\u0002\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\b\u0010\u0099\u0001\u001a\u00030\u00ad\u0002H¦@¢\u0006\u0006\b®\u0002\u0010¯\u0002J#\u0010´\u0002\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\b\u0010\u0099\u0001\u001a\u00030±\u0002H¦@¢\u0006\u0006\b²\u0002\u0010³\u0002J$\u0010¹\u0002\u001a\t\u0012\u0005\u0012\u00030¶\u00020\n2\b\u0010\u0099\u0001\u001a\u00030µ\u0002H¦@¢\u0006\u0006\b·\u0002\u0010¸\u0002J#\u0010½\u0002\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\b\u0010\u0099\u0001\u001a\u00030º\u0002H¦@¢\u0006\u0006\b»\u0002\u0010¼\u0002J#\u0010Á\u0002\u001a\b\u0012\u0004\u0012\u00020\u00020\n2\b\u0010\u0099\u0001\u001a\u00030¾\u0002H¦@¢\u0006\u0006\b¿\u0002\u0010À\u0002R$\u0010Ä\u0002\u001a\u000f\u0012\n\u0012\b\u0012\u0004\u0012\u00020H0G0\u0087\u00018&X¦\u0004¢\u0006\b\u001a\u0006\bÂ\u0002\u0010Ã\u0002R\u001e\u0010Æ\u0002\u001a\t\u0012\u0004\u0012\u00020H0\u0087\u00018&X¦\u0004¢\u0006\b\u001a\u0006\bÅ\u0002\u0010Ã\u0002R$\u0010È\u0002\u001a\u000f\u0012\n\u0012\b\u0012\u0004\u0012\u00020h0G0\u0087\u00018&X¦\u0004¢\u0006\b\u001a\u0006\bÇ\u0002\u0010Ã\u0002R$\u0010Ë\u0002\u001a\u000f\u0012\u000b\u0012\t\u0012\u0005\u0012\u00030£\u00010G0p8&X¦\u0004¢\u0006\b\u001a\u0006\bÉ\u0002\u0010Ê\u0002R%\u0010Í\u0002\u001a\u0010\u0012\u000b\u0012\t\u0012\u0005\u0012\u00030¸\u00010G0\u0087\u00018&X¦\u0004¢\u0006\b\u001a\u0006\bÌ\u0002\u0010Ã\u0002R%\u0010Ï\u0002\u001a\u0010\u0012\u000b\u0012\t\u0012\u0005\u0012\u00030¸\u00010G0\u0087\u00018&X¦\u0004¢\u0006\b\u001a\u0006\bÎ\u0002\u0010Ã\u0002R%\u0010Ñ\u0002\u001a\u0010\u0012\u000b\u0012\t\u0012\u0005\u0012\u00030½\u00010G0\u0087\u00018&X¦\u0004¢\u0006\b\u001a\u0006\bÐ\u0002\u0010Ã\u0002R%\u0010Ó\u0002\u001a\u0010\u0012\u000b\u0012\t\u0012\u0005\u0012\u00030Ó\u00010G0\u0087\u00018&X¦\u0004¢\u0006\b\u001a\u0006\bÒ\u0002\u0010Ã\u0002¨\u0006Ô\u0002À\u0006\u0003"}, d2 = {"Lcom/life360/android/membersengineapi/MembersEngineApi;", "", "", "initialize", "()V", "seedAccessTopicLoginState", "activateForegroundEagerly", "onForegroundConfirmed", "", "forceRefresh", "Lsvw;", "Lcom/life360/android/membersengineapi/models/current_user/CurrentUser;", "getCurrentUser-gIAlu-s", "(ZLcy7;)Ljava/lang/Object;", "getCurrentUser", "Lcom/life360/android/membersengineapi/models/current_user/CreateUserQuery;", "createUserQuery", "createUser-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/current_user/CreateUserQuery;Lcy7;)Ljava/lang/Object;", "createUser", "Lcom/life360/android/membersengineapi/models/current_user/CreateOtpUserQuery;", "(Lcom/life360/android/membersengineapi/models/current_user/CreateOtpUserQuery;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/membersengineapi/models/current_user/UpdateCurrentUserQuery;", "updateCurrentUserQuery", "updateCurrentUser-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/current_user/UpdateCurrentUserQuery;Lcy7;)Ljava/lang/Object;", "updateCurrentUser", "Lcom/life360/android/membersengineapi/models/current_user/UpdateCurrentUserAvatarQuery;", "updateCurrentUserAvatarQuery", "updateCurrentUserAvatar-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/current_user/UpdateCurrentUserAvatarQuery;Lcy7;)Ljava/lang/Object;", "updateCurrentUserAvatar", "Lcom/life360/android/membersengineapi/models/current_user/LookupUserQuery;", "lookupUserQuery", "Lcom/life360/android/membersengineapi/models/current_user/LookupUser;", "lookupUser-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/current_user/LookupUserQuery;Lcy7;)Ljava/lang/Object;", "lookupUser", "Lcom/life360/android/membersengineapi/models/current_user/LoginWithEmailQuery;", "loginWithEmailQuery", "loginWithEmail-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/current_user/LoginWithEmailQuery;Lcy7;)Ljava/lang/Object;", "loginWithEmail", "Lcom/life360/android/membersengineapi/models/current_user/LoginWithPhoneQuery;", "loginWithPhoneQuery", "loginWithPhone-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/current_user/LoginWithPhoneQuery;Lcy7;)Ljava/lang/Object;", "loginWithPhone", "loginWithRestoredToken-IoAF18A", "(Lcy7;)Ljava/lang/Object;", "loginWithRestoredToken", "deleteCurrentUser-IoAF18A", "deleteCurrentUser", "Lcom/life360/android/membersengineapi/models/current_user/LogoutCurrentUserQuery;", "logoutCurrentUserQuery", "logoutCurrentUser-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/current_user/LogoutCurrentUserQuery;Lcy7;)Ljava/lang/Object;", "logoutCurrentUser", "Lcom/life360/android/membersengineapi/models/current_user/ValidatePhoneNumberQuery;", "validatePhoneNumberQuery", "Lcom/life360/android/membersengineapi/models/current_user/PhoneNumberVerification;", "validatePhoneNumberWithSmsCode-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/current_user/ValidatePhoneNumberQuery;Lcy7;)Ljava/lang/Object;", "validatePhoneNumberWithSmsCode", "Lcom/life360/android/membersengineapi/models/current_user/SmsVerificationCodeQuery;", "smsVerificationCodeQuery", "sendSmsVerificationCode-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/current_user/SmsVerificationCodeQuery;Lcy7;)Ljava/lang/Object;", "sendSmsVerificationCode", "Lia20;", "defaultTtl", "", "Lcom/life360/android/membersengineapi/models/circle/Circle;", "getCircles-gIAlu-s", "(Lia20;Lcy7;)Ljava/lang/Object;", "getCircles", "getActiveCircle-IoAF18A", "getActiveCircle", "Lcom/life360/android/membersengineapi/models/circle/SwitchActiveCircleQuery;", "switchActiveCircleQuery", "switchActiveCircle-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/circle/SwitchActiveCircleQuery;Lcy7;)Ljava/lang/Object;", "switchActiveCircle", "Lcom/life360/android/membersengineapi/models/circle/CreateCircleQuery;", "createCircleQuery", "createCircle-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/circle/CreateCircleQuery;Lcy7;)Ljava/lang/Object;", "createCircle", "Lcom/life360/android/membersengineapi/models/circle/UpdateCircleQuery;", "updateCircleQuery", "updateCircle-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/circle/UpdateCircleQuery;Lcy7;)Ljava/lang/Object;", "updateCircle", "Lcom/life360/android/membersengineapi/models/circle/JoinCircleQuery;", "joinCircleQuery", "joinCircle-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/circle/JoinCircleQuery;Lcy7;)Ljava/lang/Object;", "joinCircle", "Lcom/life360/android/membersengineapi/models/circle/CreateCircleCodeQuery;", "createCircleCodeQuery", "Lcom/life360/android/membersengineapi/models/circle/CircleCode;", "createCircleCode-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/circle/CreateCircleCodeQuery;Lcy7;)Ljava/lang/Object;", "createCircleCode", "Lcom/life360/android/membersengineapi/models/member/Member;", "getActiveCircleMembers-IoAF18A", "getActiveCircleMembers", "Lcom/life360/android/membersengineapi/models/member/GetMembersQuery;", "getMembersQuery", "getMembersForCircle-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/member/GetMembersQuery;Lcy7;)Ljava/lang/Object;", "getMembersForCircle", "Llkf;", "getMembersForCircleFlow", "(Lcom/life360/android/membersengineapi/models/member/GetMembersQuery;)Llkf;", "Lcom/life360/android/membersengineapi/models/member/GetMemberByIdQuery;", "getMemberByIdQuery", "getMemberByIdForCircle-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/member/GetMemberByIdQuery;Lcy7;)Ljava/lang/Object;", "getMemberByIdForCircle", "Lcom/life360/android/membersengineapi/models/member/RemoveMemberQuery;", "removeMemberQuery", "removeMember-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/member/RemoveMemberQuery;Lcy7;)Ljava/lang/Object;", "removeMember", "Lcom/life360/android/membersengineapi/models/member/UpdateMemberAdminStatusQuery;", "updateMemberAdminStatusQuery", "updateMemberAdminStatus-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/member/UpdateMemberAdminStatusQuery;Lcy7;)Ljava/lang/Object;", "updateMemberAdminStatus", "Lcom/life360/android/membersengineapi/models/member/UpdateMemberRoleQuery;", "updateMemberRoleQuery", "updateMemberRole-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/member/UpdateMemberRoleQuery;Lcy7;)Ljava/lang/Object;", "updateMemberRole", "Ly500;", "Landroid/location/Location;", "selfUserLocationSharedFlow", "setCurrentDeviceLocationSharedFlow", "(Ly500;)V", "forceRefreshCircles-IoAF18A", "forceRefreshCircles", "forceRefreshMembersForCircle-gIAlu-s", "forceRefreshMembersForCircle", "", "getActiveCircleId", "()Ljava/lang/String;", "Lcom/life360/android/membersengineapi/models/member/UpdateMemberAvatarQuery;", "updateMemberAvatarQuery", "updateMemberAvatar-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/member/UpdateMemberAvatarQuery;Lcy7;)Ljava/lang/Object;", "updateMemberAvatar", "Lcom/life360/android/membersengineapi/models/integration/AutoTileAccountCreationAndLinkingQuery;", "query", "Lcom/life360/android/membersengineapi/models/integration/TileAccountCreationAndLinkingResult;", "createTileAccountAndLink-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/integration/AutoTileAccountCreationAndLinkingQuery;Lcy7;)Ljava/lang/Object;", "createTileAccountAndLink", "Lcom/life360/android/membersengineapi/models/integration/RequestIntegrationUrlQuery;", "requestIntegrationUrl-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/integration/RequestIntegrationUrlQuery;Lcy7;)Ljava/lang/Object;", "requestIntegrationUrl", "Lcom/life360/android/membersengineapi/models/integration/ConfirmIntegrationQuery;", "Lcom/life360/android/membersengineapi/models/integration/Integration;", "confirmIntegration-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/integration/ConfirmIntegrationQuery;Lcy7;)Ljava/lang/Object;", "confirmIntegration", "Lcom/life360/android/membersengineapi/models/integration/RemoveIntegrationQuery;", "removeIntegration-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/integration/RemoveIntegrationQuery;Lcy7;)Ljava/lang/Object;", "removeIntegration", "Lcom/life360/android/membersengineapi/models/integration/GetIntegrationsQuery;", "getIntegrations-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/integration/GetIntegrationsQuery;Lcy7;)Ljava/lang/Object;", "getIntegrations", "Lcom/life360/android/membersengineapi/models/device/AddDevicesQuery;", "addDevices-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/device/AddDevicesQuery;Lcy7;)Ljava/lang/Object;", "addDevices", "Lcom/life360/android/membersengineapi/models/device/RemoveDevicesQuery;", "removeDevices-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/device/RemoveDevicesQuery;Lcy7;)Ljava/lang/Object;", "removeDevices", "Lcom/life360/android/membersengineapi/models/device/GetDevicesQuery;", "Lcom/life360/android/membersengineapi/models/device/Device;", "getDevices-0E7RQCE", "(Lcom/life360/android/membersengineapi/models/device/GetDevicesQuery;ZLcy7;)Ljava/lang/Object;", "getDevices", "Lcom/life360/android/membersengineapi/models/device_setting/GetDeviceSettingsQuery;", "Lcom/life360/android/membersengineapi/models/device_setting/DeviceSettingState;", "getDeviceSettings-0E7RQCE", "(Lcom/life360/android/membersengineapi/models/device_setting/GetDeviceSettingsQuery;ZLcy7;)Ljava/lang/Object;", "getDeviceSettings", "Lcom/life360/android/membersengineapi/models/device_setting/SaveDeviceSettingsQuery;", "saveDeviceSettings-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/device_setting/SaveDeviceSettingsQuery;Lcy7;)Ljava/lang/Object;", "saveDeviceSettings", "deviceId", "Lcom/life360/android/membersengineapi/models/device_setting/DeviceSetting;", "setting", "", "version", DeviceSettingWireKt.WIRE_STATUS_CONFIRMED, "stageDeviceSettingLocallyFromPush", "(Ljava/lang/String;Lcom/life360/android/membersengineapi/models/device_setting/DeviceSetting;JZLcy7;)Ljava/lang/Object;", "", "Lcom/life360/android/membersengineapi/models/device/TileActivationState;", "activationStates", "getCachedDevicesForActivationStatesFlow", "(Ljava/util/Set;)Llkf;", "Lcom/life360/android/membersengineapi/models/device_state/DeviceStatesQuery;", "Lcom/life360/android/membersengineapi/models/device_state/DeviceState;", "getActiveCircleDeviceStates-0E7RQCE", "(Lcom/life360/android/membersengineapi/models/device_state/DeviceStatesQuery;ZLcy7;)Ljava/lang/Object;", "getActiveCircleDeviceStates", "circleId", "getCircleDeviceStates-BWLJW6A", "(Ljava/lang/String;Lcom/life360/android/membersengineapi/models/device_state/DeviceStatesQuery;ZLcy7;)Ljava/lang/Object;", "getCircleDeviceStates", "circleIds", "forceSyncedFreshData", "getCirclesDeviceStatesChangedFlow", "(Ljava/util/List;ZLcy7;)Ljava/lang/Object;", "getCirclesDeviceStatesChangedFlowAllowStale", "(Ljava/util/List;Lcy7;)Ljava/lang/Object;", "Lcom/life360/android/membersengineapi/models/one_time_password/OtpSendQuery;", "Lcom/life360/android/membersengineapi/models/one_time_password/SendOtp;", "sendOtpSms-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/one_time_password/OtpSendQuery;Lcy7;)Ljava/lang/Object;", "sendOtpSms", "Lcom/life360/android/membersengineapi/models/one_time_password/OtpVerifyQuery;", "verifyOtpCode-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/one_time_password/OtpVerifyQuery;Lcy7;)Ljava/lang/Object;", "verifyOtpCode", "Lcom/life360/android/membersengineapi/models/one_time_password/SignInRecoveryChallengeQuery;", "Lcom/life360/android/membersengineapi/models/one_time_password/RecoveryChallenge;", "startSignInRecoveryChallenge-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/one_time_password/SignInRecoveryChallengeQuery;Lcy7;)Ljava/lang/Object;", "startSignInRecoveryChallenge", "Lcom/life360/android/membersengineapi/models/device/ActivateTileQuery;", "Lcom/life360/android/membersengineapi/models/device/TileActivationIdData;", "activateTile-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/device/ActivateTileQuery;Lcy7;)Ljava/lang/Object;", "activateTile", "Lcom/life360/android/membersengineapi/models/device/AssociateTileQuery;", "finalizeTileActivation-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/device/AssociateTileQuery;Lcy7;)Ljava/lang/Object;", "finalizeTileActivation", "associateTile-gIAlu-s", "associateTile", "Lcom/life360/android/membersengineapi/models/device/UpdateTileProfileQuery;", "updateTileProfile-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/device/UpdateTileProfileQuery;Lcy7;)Ljava/lang/Object;", "updateTileProfile", "Lcom/life360/android/membersengineapi/models/device/DeactivateTileQuery;", "deactivateTile-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/device/DeactivateTileQuery;Lcy7;)Ljava/lang/Object;", "deactivateTile", "isDeviceRegisteredForActivationRecovery", "(Ljava/lang/String;)Z", "Lcom/life360/android/membersengineapi/models/device/ReportDeviceFirmwareVersionQuery;", "reportDeviceFirmwareVersion-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/device/ReportDeviceFirmwareVersionQuery;Lcy7;)Ljava/lang/Object;", "reportDeviceFirmwareVersion", "Lcom/life360/android/membersengineapi/models/device/ReportBatteryReplacedQuery;", "reportBatteryReplaced-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/device/ReportBatteryReplacedQuery;Lcy7;)Ljava/lang/Object;", "reportBatteryReplaced", "Lcom/life360/android/membersengineapi/models/dsar/DsarQuery;", "Lcom/life360/android/membersengineapi/models/dsar/Dsar;", "sendDataSubjectAccessRequest-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/dsar/DsarQuery;Lcy7;)Ljava/lang/Object;", "sendDataSubjectAccessRequest", "isLoggedIn", "()Z", "subscribeToMqttTopicForCircles", "(Ljava/util/List;)V", "Lcom/life360/android/membersengineapi/models/profile/GetProfilesAndDevicesQuery;", "Lcom/life360/android/membersengineapi/models/profile/ProfileWithDevice;", "getProfilesAndDevicesChangedForCirclesFlow", "(Lcom/life360/android/membersengineapi/models/profile/GetProfilesAndDevicesQuery;)Llkf;", "getProfilesAndDevices-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/profile/GetProfilesAndDevicesQuery;Lcy7;)Ljava/lang/Object;", "getProfilesAndDevices", "Lcom/life360/android/membersengineapi/models/profile/GetProfilesQuery;", "Lcom/life360/android/membersengineapi/models/profile/Profile;", "getProfilesChangedForCirclesFlow", "(Lcom/life360/android/membersengineapi/models/profile/GetProfilesQuery;)Llkf;", "Lcom/life360/android/membersengineapi/models/profile/GetProfileQuery;", "getProfileFlow", "(Lcom/life360/android/membersengineapi/models/profile/GetProfileQuery;)Llkf;", "getProfile-0E7RQCE", "(Lcom/life360/android/membersengineapi/models/profile/GetProfileQuery;ZLcy7;)Ljava/lang/Object;", "getProfile", "getProfiles-0E7RQCE", "(Lcom/life360/android/membersengineapi/models/profile/GetProfilesQuery;ZLcy7;)Ljava/lang/Object;", "getProfiles", "Lcom/life360/android/membersengineapi/models/profile/CreateProfileQuery;", "createProfile-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/profile/CreateProfileQuery;Lcy7;)Ljava/lang/Object;", "createProfile", "Lcom/life360/android/membersengineapi/models/profile/UpdateProfileQuery;", "updateProfile-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/profile/UpdateProfileQuery;Lcy7;)Ljava/lang/Object;", "updateProfile", "Lcom/life360/android/membersengineapi/models/profile/DeleteProfileQuery;", "deleteProfile-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/profile/DeleteProfileQuery;Lcy7;)Ljava/lang/Object;", "deleteProfile", "Lcom/life360/android/membersengineapi/models/profile/UploadPetProfileAvatarQuery;", "Lcom/life360/android/membersengineapi/models/pet/PetProfile;", "uploadPetProfileAvatar-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/profile/UploadPetProfileAvatarQuery;Lcy7;)Ljava/lang/Object;", "uploadPetProfileAvatar", "Lcom/life360/android/membersengineapi/models/profile/LinkDeviceToProfileQuery;", "linkDeviceToProfile-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/profile/LinkDeviceToProfileQuery;Lcy7;)Ljava/lang/Object;", "linkDeviceToProfile", "Lcom/life360/android/membersengineapi/models/current_user/RegisterDeviceToUserQuery;", "registerDeviceToUser-gIAlu-s", "(Lcom/life360/android/membersengineapi/models/current_user/RegisterDeviceToUserQuery;Lcy7;)Ljava/lang/Object;", "registerDeviceToUser", "getCirclesChangedSharedFlow", "()Ly500;", "circlesChangedSharedFlow", "getActiveCircleChangedSharedFlow", "activeCircleChangedSharedFlow", "getActiveCircleMembersChangedSharedFlow", "activeCircleMembersChangedSharedFlow", "getIntegrationsChangedSharedFlow", "()Llkf;", "integrationsChangedSharedFlow", "getDevicesChangedSharedFlow", "devicesChangedSharedFlow", "getActiveCircleDevicesChangedSharedFlow", "activeCircleDevicesChangedSharedFlow", "getDeviceSettingsChangedSharedFlow", "deviceSettingsChangedSharedFlow", "getActiveCircleDeviceStatesChangedSharedFlow", "activeCircleDeviceStatesChangedSharedFlow", "api"}, k = 1, mv = {2, 4, 0}, xi = 48)
public interface MembersEngineApi {

    /* JADX INFO: loaded from: classes5.dex */
    @Metadata(k = 3, mv = {2, 4, 0}, xi = 816)
    public static final class DefaultImpls {
    }

    /* JADX INFO: renamed from: getActiveCircleDeviceStates-0E7RQCE$default, reason: not valid java name */
    static /* synthetic */ Object m589getActiveCircleDeviceStates0E7RQCE$default(MembersEngineApi membersEngineApi, DeviceStatesQuery deviceStatesQuery, boolean z, cy7 cy7Var, int i, Object obj) {
        if (obj != null) {
            i6.j("Super calls with default arguments not supported in this target, function: getActiveCircleDeviceStates-0E7RQCE");
            return null;
        }
        if ((i & 2) != 0) {
            z = false;
        }
        return membersEngineApi.mo350getActiveCircleDeviceStates0E7RQCE(deviceStatesQuery, z, cy7Var);
    }

    /* JADX INFO: renamed from: getCircleDeviceStates-BWLJW6A$default, reason: not valid java name */
    static /* synthetic */ Object m590getCircleDeviceStatesBWLJW6A$default(MembersEngineApi membersEngineApi, String str, DeviceStatesQuery deviceStatesQuery, boolean z, cy7 cy7Var, int i, Object obj) {
        if (obj != null) {
            i6.j("Super calls with default arguments not supported in this target, function: getCircleDeviceStates-BWLJW6A");
            return null;
        }
        if ((i & 4) != 0) {
            z = false;
        }
        return membersEngineApi.mo352getCircleDeviceStatesBWLJW6A(str, deviceStatesQuery, z, cy7Var);
    }

    /* JADX INFO: renamed from: getCircles-gIAlu-s$default, reason: not valid java name */
    static /* synthetic */ Object m591getCirclesgIAlus$default(MembersEngineApi membersEngineApi, ia20 ia20Var, cy7 cy7Var, int i, Object obj) {
        if (obj != null) {
            i6.j("Super calls with default arguments not supported in this target, function: getCircles-gIAlu-s");
            return null;
        }
        if ((i & 1) != 0) {
            ia20Var = w920.a;
        }
        return membersEngineApi.mo353getCirclesgIAlus(ia20Var, cy7Var);
    }

    static /* synthetic */ Object getCirclesDeviceStatesChangedFlow$default(MembersEngineApi membersEngineApi, List list, boolean z, cy7 cy7Var, int i, Object obj) {
        if (obj != null) {
            i6.j("Super calls with default arguments not supported in this target, function: getCirclesDeviceStatesChangedFlow");
            return null;
        }
        if ((i & 2) != 0) {
            z = false;
        }
        return membersEngineApi.getCirclesDeviceStatesChangedFlow(list, z, cy7Var);
    }

    /* JADX INFO: renamed from: getCurrentUser-gIAlu-s$default, reason: not valid java name */
    static /* synthetic */ Object m592getCurrentUsergIAlus$default(MembersEngineApi membersEngineApi, boolean z, cy7 cy7Var, int i, Object obj) {
        if (obj != null) {
            i6.j("Super calls with default arguments not supported in this target, function: getCurrentUser-gIAlu-s");
            return null;
        }
        if ((i & 1) != 0) {
            z = false;
        }
        return membersEngineApi.mo355getCurrentUsergIAlus(z, cy7Var);
    }

    /* JADX INFO: renamed from: getDeviceSettings-0E7RQCE$default, reason: not valid java name */
    static /* synthetic */ Object m593getDeviceSettings0E7RQCE$default(MembersEngineApi membersEngineApi, GetDeviceSettingsQuery getDeviceSettingsQuery, boolean z, cy7 cy7Var, int i, Object obj) {
        if (obj != null) {
            i6.j("Super calls with default arguments not supported in this target, function: getDeviceSettings-0E7RQCE");
            return null;
        }
        if ((i & 2) != 0) {
            z = false;
        }
        return membersEngineApi.mo357getDeviceSettings0E7RQCE(getDeviceSettingsQuery, z, cy7Var);
    }

    /* JADX INFO: renamed from: getDevices-0E7RQCE$default, reason: not valid java name */
    static /* synthetic */ Object m594getDevices0E7RQCE$default(MembersEngineApi membersEngineApi, GetDevicesQuery getDevicesQuery, boolean z, cy7 cy7Var, int i, Object obj) {
        if (obj != null) {
            i6.j("Super calls with default arguments not supported in this target, function: getDevices-0E7RQCE");
            return null;
        }
        if ((i & 2) != 0) {
            z = false;
        }
        return membersEngineApi.mo358getDevices0E7RQCE(getDevicesQuery, z, cy7Var);
    }

    /* JADX INFO: renamed from: getProfile-0E7RQCE$default, reason: not valid java name */
    static /* synthetic */ Object m595getProfile0E7RQCE$default(MembersEngineApi membersEngineApi, GetProfileQuery getProfileQuery, boolean z, cy7 cy7Var, int i, Object obj) {
        if (obj != null) {
            i6.j("Super calls with default arguments not supported in this target, function: getProfile-0E7RQCE");
            return null;
        }
        if ((i & 2) != 0) {
            z = false;
        }
        return membersEngineApi.mo362getProfile0E7RQCE(getProfileQuery, z, cy7Var);
    }

    /* JADX INFO: renamed from: getProfiles-0E7RQCE$default, reason: not valid java name */
    static /* synthetic */ Object m596getProfiles0E7RQCE$default(MembersEngineApi membersEngineApi, GetProfilesQuery getProfilesQuery, boolean z, cy7 cy7Var, int i, Object obj) {
        if (obj != null) {
            i6.j("Super calls with default arguments not supported in this target, function: getProfiles-0E7RQCE");
            return null;
        }
        if ((i & 2) != 0) {
            z = false;
        }
        return membersEngineApi.mo363getProfiles0E7RQCE(getProfilesQuery, z, cy7Var);
    }

    static /* synthetic */ Object stageDeviceSettingLocallyFromPush$default(MembersEngineApi membersEngineApi, String str, DeviceSetting deviceSetting, long j, boolean z, cy7 cy7Var, int i, Object obj) {
        if (obj != null) {
            i6.j("Super calls with default arguments not supported in this target, function: stageDeviceSettingLocallyFromPush");
            return null;
        }
        if ((i & 8) != 0) {
            z = true;
        }
        return membersEngineApi.stageDeviceSettingLocallyFromPush(str, deviceSetting, j, z, cy7Var);
    }

    void activateForegroundEagerly();

    /* JADX INFO: renamed from: activateTile-gIAlu-s */
    Object mo333activateTilegIAlus(ActivateTileQuery activateTileQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: addDevices-gIAlu-s */
    Object mo334addDevicesgIAlus(AddDevicesQuery addDevicesQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: associateTile-gIAlu-s */
    Object mo335associateTilegIAlus(AssociateTileQuery associateTileQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: confirmIntegration-gIAlu-s */
    Object mo336confirmIntegrationgIAlus(ConfirmIntegrationQuery confirmIntegrationQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: createCircle-gIAlu-s */
    Object mo337createCirclegIAlus(CreateCircleQuery createCircleQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: createCircleCode-gIAlu-s */
    Object mo338createCircleCodegIAlus(CreateCircleCodeQuery createCircleCodeQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: createProfile-gIAlu-s */
    Object mo339createProfilegIAlus(CreateProfileQuery createProfileQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: createTileAccountAndLink-gIAlu-s */
    Object mo340createTileAccountAndLinkgIAlus(AutoTileAccountCreationAndLinkingQuery autoTileAccountCreationAndLinkingQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: createUser-gIAlu-s */
    Object mo341createUsergIAlus(CreateOtpUserQuery createOtpUserQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: createUser-gIAlu-s */
    Object mo342createUsergIAlus(CreateUserQuery createUserQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: deactivateTile-gIAlu-s */
    Object mo343deactivateTilegIAlus(DeactivateTileQuery deactivateTileQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: deleteCurrentUser-IoAF18A */
    Object mo344deleteCurrentUserIoAF18A(cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: deleteProfile-gIAlu-s */
    Object mo345deleteProfilegIAlus(DeleteProfileQuery deleteProfileQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: finalizeTileActivation-gIAlu-s */
    Object mo346finalizeTileActivationgIAlus(AssociateTileQuery associateTileQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: forceRefreshCircles-IoAF18A */
    Object mo347forceRefreshCirclesIoAF18A(cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: forceRefreshMembersForCircle-gIAlu-s */
    Object mo348forceRefreshMembersForCirclegIAlus(GetMembersQuery getMembersQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: getActiveCircle-IoAF18A */
    Object mo349getActiveCircleIoAF18A(cy7<? super svw> cy7Var);

    y500 getActiveCircleChangedSharedFlow();

    /* JADX INFO: renamed from: getActiveCircleDeviceStates-0E7RQCE */
    Object mo350getActiveCircleDeviceStates0E7RQCE(DeviceStatesQuery deviceStatesQuery, boolean z, cy7<? super svw> cy7Var);

    y500 getActiveCircleDeviceStatesChangedSharedFlow();

    y500 getActiveCircleDevicesChangedSharedFlow();

    String getActiveCircleId();

    /* JADX INFO: renamed from: getActiveCircleMembers-IoAF18A */
    Object mo351getActiveCircleMembersIoAF18A(cy7<? super svw> cy7Var);

    y500 getActiveCircleMembersChangedSharedFlow();

    lkf getCachedDevicesForActivationStatesFlow(Set<? extends TileActivationState> activationStates);

    /* JADX INFO: renamed from: getCircleDeviceStates-BWLJW6A */
    Object mo352getCircleDeviceStatesBWLJW6A(String str, DeviceStatesQuery deviceStatesQuery, boolean z, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: getCircles-gIAlu-s */
    Object mo353getCirclesgIAlus(ia20 ia20Var, cy7<? super svw> cy7Var);

    y500 getCirclesChangedSharedFlow();

    Object getCirclesDeviceStatesChangedFlow(List<String> list, boolean z, cy7<? super lkf> cy7Var);

    Object getCirclesDeviceStatesChangedFlowAllowStale(List<String> list, cy7<? super lkf> cy7Var);

    /* JADX INFO: renamed from: getCurrentUser-gIAlu-s */
    Object mo355getCurrentUsergIAlus(boolean z, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: getDeviceSettings-0E7RQCE */
    Object mo357getDeviceSettings0E7RQCE(GetDeviceSettingsQuery getDeviceSettingsQuery, boolean z, cy7<? super svw> cy7Var);

    y500 getDeviceSettingsChangedSharedFlow();

    /* JADX INFO: renamed from: getDevices-0E7RQCE */
    Object mo358getDevices0E7RQCE(GetDevicesQuery getDevicesQuery, boolean z, cy7<? super svw> cy7Var);

    y500 getDevicesChangedSharedFlow();

    /* JADX INFO: renamed from: getIntegrations-gIAlu-s */
    Object mo359getIntegrationsgIAlus(GetIntegrationsQuery getIntegrationsQuery, cy7<? super svw> cy7Var);

    lkf getIntegrationsChangedSharedFlow();

    @opa
    /* JADX INFO: renamed from: getMemberByIdForCircle-gIAlu-s */
    Object mo360getMemberByIdForCirclegIAlus(GetMemberByIdQuery getMemberByIdQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: getMembersForCircle-gIAlu-s */
    Object mo361getMembersForCirclegIAlus(GetMembersQuery getMembersQuery, cy7<? super svw> cy7Var);

    lkf getMembersForCircleFlow(GetMembersQuery getMembersQuery);

    /* JADX INFO: renamed from: getProfile-0E7RQCE */
    Object mo362getProfile0E7RQCE(GetProfileQuery getProfileQuery, boolean z, cy7<? super svw> cy7Var);

    lkf getProfileFlow(GetProfileQuery query);

    /* JADX INFO: renamed from: getProfiles-0E7RQCE */
    Object mo363getProfiles0E7RQCE(GetProfilesQuery getProfilesQuery, boolean z, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: getProfilesAndDevices-gIAlu-s */
    Object mo364getProfilesAndDevicesgIAlus(GetProfilesAndDevicesQuery getProfilesAndDevicesQuery, cy7<? super svw> cy7Var);

    lkf getProfilesAndDevicesChangedForCirclesFlow(GetProfilesAndDevicesQuery query);

    lkf getProfilesChangedForCirclesFlow(GetProfilesQuery query);

    void initialize();

    boolean isDeviceRegisteredForActivationRecovery(String deviceId);

    boolean isLoggedIn();

    /* JADX INFO: renamed from: joinCircle-gIAlu-s */
    Object mo366joinCirclegIAlus(JoinCircleQuery joinCircleQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: linkDeviceToProfile-gIAlu-s */
    Object mo367linkDeviceToProfilegIAlus(LinkDeviceToProfileQuery linkDeviceToProfileQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: loginWithEmail-gIAlu-s */
    Object mo368loginWithEmailgIAlus(LoginWithEmailQuery loginWithEmailQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: loginWithPhone-gIAlu-s */
    Object mo370loginWithPhonegIAlus(LoginWithPhoneQuery loginWithPhoneQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: loginWithRestoredToken-IoAF18A */
    Object mo372loginWithRestoredTokenIoAF18A(cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: logoutCurrentUser-gIAlu-s */
    Object mo373logoutCurrentUsergIAlus(LogoutCurrentUserQuery logoutCurrentUserQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: lookupUser-gIAlu-s */
    Object mo374lookupUsergIAlus(LookupUserQuery lookupUserQuery, cy7<? super svw> cy7Var);

    void onForegroundConfirmed();

    /* JADX INFO: renamed from: registerDeviceToUser-gIAlu-s */
    Object mo376registerDeviceToUsergIAlus(RegisterDeviceToUserQuery registerDeviceToUserQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: removeDevices-gIAlu-s */
    Object mo377removeDevicesgIAlus(RemoveDevicesQuery removeDevicesQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: removeIntegration-gIAlu-s */
    Object mo378removeIntegrationgIAlus(RemoveIntegrationQuery removeIntegrationQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: removeMember-gIAlu-s */
    Object mo379removeMembergIAlus(RemoveMemberQuery removeMemberQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: reportBatteryReplaced-gIAlu-s */
    Object mo380reportBatteryReplacedgIAlus(ReportBatteryReplacedQuery reportBatteryReplacedQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: reportDeviceFirmwareVersion-gIAlu-s */
    Object mo381reportDeviceFirmwareVersiongIAlus(ReportDeviceFirmwareVersionQuery reportDeviceFirmwareVersionQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: requestIntegrationUrl-gIAlu-s */
    Object mo382requestIntegrationUrlgIAlus(RequestIntegrationUrlQuery requestIntegrationUrlQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: saveDeviceSettings-gIAlu-s */
    Object mo383saveDeviceSettingsgIAlus(SaveDeviceSettingsQuery saveDeviceSettingsQuery, cy7<? super svw> cy7Var);

    void seedAccessTopicLoginState();

    /* JADX INFO: renamed from: sendDataSubjectAccessRequest-gIAlu-s */
    Object mo384sendDataSubjectAccessRequestgIAlus(DsarQuery dsarQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: sendOtpSms-gIAlu-s */
    Object mo385sendOtpSmsgIAlus(OtpSendQuery otpSendQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: sendSmsVerificationCode-gIAlu-s */
    Object mo386sendSmsVerificationCodegIAlus(SmsVerificationCodeQuery smsVerificationCodeQuery, cy7<? super svw> cy7Var);

    void setCurrentDeviceLocationSharedFlow(y500 selfUserLocationSharedFlow);

    Object stageDeviceSettingLocallyFromPush(String str, DeviceSetting deviceSetting, long j, boolean z, cy7<? super Unit> cy7Var);

    /* JADX INFO: renamed from: startSignInRecoveryChallenge-gIAlu-s */
    Object mo388startSignInRecoveryChallengegIAlus(SignInRecoveryChallengeQuery signInRecoveryChallengeQuery, cy7<? super svw> cy7Var);

    void subscribeToMqttTopicForCircles(List<String> circleIds);

    /* JADX INFO: renamed from: switchActiveCircle-gIAlu-s */
    Object mo389switchActiveCirclegIAlus(SwitchActiveCircleQuery switchActiveCircleQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: updateCircle-gIAlu-s */
    Object mo390updateCirclegIAlus(UpdateCircleQuery updateCircleQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: updateCurrentUser-gIAlu-s */
    Object mo391updateCurrentUsergIAlus(UpdateCurrentUserQuery updateCurrentUserQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: updateCurrentUserAvatar-gIAlu-s */
    Object mo392updateCurrentUserAvatargIAlus(UpdateCurrentUserAvatarQuery updateCurrentUserAvatarQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: updateMemberAdminStatus-gIAlu-s */
    Object mo393updateMemberAdminStatusgIAlus(UpdateMemberAdminStatusQuery updateMemberAdminStatusQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: updateMemberAvatar-gIAlu-s */
    Object mo394updateMemberAvatargIAlus(UpdateMemberAvatarQuery updateMemberAvatarQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: updateMemberRole-gIAlu-s */
    Object mo395updateMemberRolegIAlus(UpdateMemberRoleQuery updateMemberRoleQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: updateProfile-gIAlu-s */
    Object mo396updateProfilegIAlus(UpdateProfileQuery updateProfileQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: updateTileProfile-gIAlu-s */
    Object mo398updateTileProfilegIAlus(UpdateTileProfileQuery updateTileProfileQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: uploadPetProfileAvatar-gIAlu-s */
    Object mo399uploadPetProfileAvatargIAlus(UploadPetProfileAvatarQuery uploadPetProfileAvatarQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: validatePhoneNumberWithSmsCode-gIAlu-s */
    Object mo400validatePhoneNumberWithSmsCodegIAlus(ValidatePhoneNumberQuery validatePhoneNumberQuery, cy7<? super svw> cy7Var);

    /* JADX INFO: renamed from: verifyOtpCode-gIAlu-s */
    Object mo401verifyOtpCodegIAlus(OtpVerifyQuery otpVerifyQuery, cy7<? super svw> cy7Var);
}
