package com.life360.android.location.controllers;

import android.app.PendingIntent;
import android.app.Service;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.SharedPreferences;
import android.content.pm.PackageInfo;
import android.os.Handler;
import android.os.HandlerThread;
import android.os.IBinder;
import android.os.Looper;
import com.facebook.internal.d;
import com.google.android.gms.common.GoogleApiAvailability;
import com.google.android.gms.common.a;
import com.google.android.gms.location.LocationServices;
import com.life360.android.core.models.DeviceConfigProvider;
import com.life360.android.core.models.GenesisFeatureAccess;
import com.life360.android.flags.statsig.GateFlag;
import com.life360.android.l360networkkit.GpiConnectionWarmer;
import com.life360.android.l360networkkit.internal.GpiErrorSharedPreferences;
import com.life360.android.location.controllers.EventController;
import com.life360.android.settings.features.CasperRemoteFlagProvider;
import com.life360.eventhistorycore.sensorrecording.b;
import com.life360.utils360.PushTraceExtras;
import defpackage.a6t;
import defpackage.a72;
import defpackage.a7p;
import defpackage.add0;
import defpackage.ajm;
import defpackage.ao;
import defpackage.arc;
import defpackage.asg;
import defpackage.asr;
import defpackage.avk;
import defpackage.b7p;
import defpackage.b9r;
import defpackage.bjd;
import defpackage.bmc;
import defpackage.bre;
import defpackage.bsr;
import defpackage.bth;
import defpackage.bvk;
import defpackage.bz2;
import defpackage.c2l;
import defpackage.cb1;
import defpackage.cic;
import defpackage.csr;
import defpackage.cwa;
import defpackage.cwu;
import defpackage.cy7;
import defpackage.dar;
import defpackage.db9;
import defpackage.dej;
import defpackage.dhf;
import defpackage.di50;
import defpackage.dka;
import defpackage.doz;
import defpackage.dsd;
import defpackage.e41;
import defpackage.e8h0;
import defpackage.ebp;
import defpackage.env;
import defpackage.eoz;
import defpackage.ere;
import defpackage.esi;
import defpackage.eud;
import defpackage.f8d;
import defpackage.fbp;
import defpackage.fgf;
import defpackage.fmc;
import defpackage.fmv;
import defpackage.foz;
import defpackage.fq7;
import defpackage.ftu;
import defpackage.fu;
import defpackage.fud;
import defpackage.fv80;
import defpackage.gbp;
import defpackage.gom;
import defpackage.goz;
import defpackage.gry;
import defpackage.gud;
import defpackage.h2c;
import defpackage.h820;
import defpackage.hbp;
import defpackage.hea;
import defpackage.hha;
import defpackage.hj70;
import defpackage.hs;
import defpackage.hxn;
import defpackage.i4m;
import defpackage.i510;
import defpackage.i73;
import defpackage.i7l;
import defpackage.ijj;
import defpackage.imd;
import defpackage.iu;
import defpackage.iud;
import defpackage.iyy;
import defpackage.izh;
import defpackage.j03;
import defpackage.j9a0;
import defpackage.ja7;
import defpackage.jgf;
import defpackage.jke;
import defpackage.jo0;
import defpackage.jud;
import defpackage.ke80;
import defpackage.ked;
import defpackage.kfh;
import defpackage.kr50;
import defpackage.kv80;
import defpackage.kv9;
import defpackage.kx1;
import defpackage.l510;
import defpackage.l9v;
import defpackage.lgh;
import defpackage.lsz;
import defpackage.lud;
import defpackage.lw2;
import defpackage.lx40;
import defpackage.m2f;
import defpackage.m510;
import defpackage.m7r;
import defpackage.mhh;
import defpackage.mmc;
import defpackage.mud;
import defpackage.mw2;
import defpackage.mx40;
import defpackage.n090;
import defpackage.n900;
import defpackage.ndm;
import defpackage.ndy;
import defpackage.ne3;
import defpackage.nij;
import defpackage.nud;
import defpackage.nx7;
import defpackage.nym;
import defpackage.o0k;
import defpackage.o24;
import defpackage.o91;
import defpackage.o9r;
import defpackage.ody;
import defpackage.ojm;
import defpackage.om60;
import defpackage.oom;
import defpackage.oud;
import defpackage.oz1;
import defpackage.p710;
import defpackage.pv1;
import defpackage.pvk;
import defpackage.pz1;
import defpackage.q03;
import defpackage.q38;
import defpackage.q41;
import defpackage.q69;
import defpackage.qgh;
import defpackage.qi20;
import defpackage.qoa;
import defpackage.qud;
import defpackage.rea;
import defpackage.rf1;
import defpackage.rgh;
import defpackage.rtx;
import defpackage.rud;
import defpackage.rvb;
import defpackage.rz2;
import defpackage.s410;
import defpackage.s8d;
import defpackage.sdm;
import defpackage.sud;
import defpackage.sw50;
import defpackage.tcm;
import defpackage.tef;
import defpackage.tfh;
import defpackage.tim;
import defpackage.tlb0;
import defpackage.tod0;
import defpackage.tr6;
import defpackage.tud;
import defpackage.tvw;
import defpackage.u3g;
import defpackage.u410;
import defpackage.u6m;
import defpackage.u720;
import defpackage.u7r;
import defpackage.u9r;
import defpackage.ucd;
import defpackage.ud7;
import defpackage.ue3;
import defpackage.ugj;
import defpackage.uh1;
import defpackage.umv;
import defpackage.uu;
import defpackage.v2p;
import defpackage.v5p;
import defpackage.vam;
import defpackage.vba;
import defpackage.vs6;
import defpackage.vsg;
import defpackage.vz1;
import defpackage.w24;
import defpackage.w98;
import defpackage.wdm;
import defpackage.wh20;
import defpackage.wid;
import defpackage.wmv;
import defpackage.wq;
import defpackage.wuz;
import defpackage.x5b0;
import defpackage.x5h;
import defpackage.xi10;
import defpackage.xov;
import defpackage.y7u;
import defpackage.y91;
import defpackage.y9c;
import defpackage.y9l;
import defpackage.ybv;
import defpackage.yhh;
import defpackage.yid0;
import defpackage.yoc;
import defpackage.yr50;
import defpackage.yv80;
import defpackage.z6m;
import defpackage.z98;
import defpackage.zcd;
import defpackage.zh1;
import defpackage.zpz;
import defpackage.zv2;
import defpackage.zw50;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Iterator;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;
import kotlin.jvm.functions.Function1;
import kotlin.jvm.internal.Intrinsics;
import kotlin.text.c;
import org.json.JSONObject;

/* JADX INFO: loaded from: classes.dex */
public final class EventController extends Service {
    public static final /* synthetic */ int O0 = 0;
    public n090 A;
    public CasperRemoteFlagProvider A0;
    public lgh B;
    public v5p B0;
    public sdm C;
    public vz1 C0;
    public hj70 D;
    public vam D0;
    public y7u E;
    public lx40 E0;
    public umv F;
    public i7l F0;
    public ugj G;
    public i7l G0;
    public pvk H;
    public i7l H0;
    public zw50 I;
    public i7l I0;
    public fgf J;
    public wq J0;
    public final u720 K;
    public qi20 K0;
    public dhf L0;
    public GpiConnectionWarmer M0;
    public final u720 N;
    public final d N0;
    public final u720 P;
    public final u720 Q;
    public final u720 T;
    public boolean a;
    public final u720 a0;
    public final u720 f;
    public c2l f0;
    public c2l g0;
    public o9r h;
    public c2l h0;
    public rtx i;
    public ue3 i0;
    public xi10 j;
    public lw2 j0;
    public gry k;
    public rz2 k0;
    public m2f l;
    public s410 l0;
    public yr50 m;
    public l510 m0;
    public kr50 n;
    public i510 n0;
    public yhh o;
    public arc o0;

    /* JADX INFO: renamed from: p, reason: collision with root package name */
    public wdm f1006p;
    public ne3 p0;
    public tcm q;
    public ebp q0;
    public asg r;
    public eoz r0;
    public om60 s;
    public j03 s0;
    public q03 t;
    public GpiErrorSharedPreferences t0;
    public uu u;
    public h820 u0;
    public kv9 v;
    public i7l v0;
    public j9a0 w;
    public avk w0;
    public ud7 x;
    public vba x0;
    public izh y;
    public lsz y0;
    public z6m z;
    public vsg z0;
    public final ja7 b = new ja7();
    public final u720 c = y9l.b(new hs(this, 5));
    public final HandlerThread d = new HandlerThread("EventController", 10);
    public final u720 e = y9l.b(new hs(this, 8));
    public xov g = new xov();
    public final u720 L = y9l.b(new imd(15));
    public final u720 M = y9l.b(new imd(16));
    public final u720 O = y9l.b(new imd(17));
    public final u720 R = y9l.b(new hs(this, 13));
    public final u720 S = y9l.b(new imd(22));
    public final u720 U = y9l.b(new imd(27));
    public final u720 V = y9l.b(new imd(29));
    public final u720 W = y9l.b(new sud(0));
    public final u720 X = y9l.b(new sud(1));
    public final u720 Y = y9l.b(new sud(2));
    public final u720 Z = y9l.b(new sud(3));
    public final u720 b0 = y9l.b(new hs(this, 9));
    public final u720 c0 = y9l.b(new hs(this, 10));
    public final AtomicBoolean d0 = new AtomicBoolean(false);
    public final AtomicBoolean e0 = new AtomicBoolean(false);

    public EventController() {
        byte b = 12;
        this.f = y9l.b(new imd(b));
        byte b2 = 14;
        this.K = y9l.b(new imd(b2));
        this.N = y9l.b(new hs(this, b));
        byte b3 = 18;
        this.P = y9l.b(new imd(b3));
        this.Q = y9l.b(new hs(this, b2));
        this.T = y9l.b(new hs(this, b3));
        byte b4 = 7;
        this.a0 = y9l.b(new hs(this, b4));
        this.N0 = new d(b4, this);
    }

    public static void p(String str, String str2, String str3) {
        StringBuilder sbT = bz2.t("observable reset: stream=", str, ", source=", str2, ", error=");
        sbT.append(str3);
        ObservableResetException observableResetException = new ObservableResetException(sbT.toString());
        w98 w98Var = z98.a;
        if (w98Var != null) {
            w98Var.b(observableResetException);
        }
    }

    public final vz1 a() {
        vz1 vz1Var = this.C0;
        if (vz1Var != null) {
            return vz1Var;
        }
        Intrinsics.k("appSettings");
        throw null;
    }

    public final lw2 b() {
        lw2 lw2Var = this.j0;
        if (lw2Var != null) {
            return lw2Var;
        }
        Intrinsics.k("awarenessEngineApi");
        throw null;
    }

    public final arc c() {
        arc arcVar = this.o0;
        if (arcVar != null) {
            return arcVar;
        }
        Intrinsics.k("dwellStatusRule");
        throw null;
    }

    public final avk d() {
        avk avkVar = this.w0;
        if (avkVar != null) {
            return avkVar;
        }
        Intrinsics.k("externalAwarenessComponent");
        throw null;
    }

    public final dhf e() {
        dhf dhfVar = this.L0;
        if (dhfVar != null) {
            return dhfVar;
        }
        Intrinsics.k("flightTopicProvider");
        throw null;
    }

    public final vba f() {
        vba vbaVar = this.x0;
        if (vbaVar != null) {
            return vbaVar;
        }
        Intrinsics.k("l360GeospatialProvider");
        throw null;
    }

    public final u6m g() {
        return (u6m) this.f.getValue();
    }

    public final qi20 h() {
        qi20 qi20Var = this.K0;
        if (qi20Var != null) {
            return qi20Var;
        }
        Intrinsics.k("takeoffTopicProvider");
        throw null;
    }

    /* JADX WARN: Code duplicated, block: B:142:0x0a4e  */
    /* JADX WARN: Code duplicated, block: B:145:0x0ba3  */
    /* JADX WARN: Code duplicated, block: B:147:0x0bbf  */
    /* JADX WARN: Code duplicated, block: B:148:0x0bc1  */
    /* JADX WARN: Code duplicated, block: B:151:0x0bcc  */
    /* JADX WARN: Code duplicated, block: B:152:0x0bce  */
    /* JADX WARN: Code duplicated, block: B:155:0x0be2  */
    /* JADX WARN: Code duplicated, block: B:157:0x0c6c  */
    /* JADX WARN: Code duplicated, block: B:164:0x0c90  */
    /* JADX WARN: Code duplicated, block: B:167:0x0d11  */
    /* JADX WARN: Code duplicated, block: B:169:0x0d27  */
    /* JADX WARN: Code duplicated, block: B:171:0x0d36  */
    /* JADX WARN: Code duplicated, block: B:173:0x0d99  */
    /* JADX WARN: Code duplicated, block: B:176:0x0db3  */
    /* JADX WARN: Code duplicated, block: B:178:0x0dc4  */
    /* JADX WARN: Code duplicated, block: B:180:0x0dcd  */
    /* JADX WARN: Code duplicated, block: B:183:0x0e04  */
    /* JADX WARN: Code duplicated, block: B:185:0x0e38  */
    /* JADX WARN: Code duplicated, block: B:189:0x0e44  */
    /* JADX WARN: Code duplicated, block: B:191:0x0e53  */
    /* JADX WARN: Code duplicated, block: B:195:0x0e9e  */
    /* JADX WARN: Code duplicated, block: B:197:0x0ed7  */
    /* JADX WARN: Code duplicated, block: B:199:0x0f0b  */
    /* JADX WARN: Code duplicated, block: B:202:0x0f22  */
    /* JADX WARN: Code duplicated, block: B:204:0x0f26  */
    /* JADX WARN: Code duplicated, block: B:205:0x0f30  */
    /* JADX WARN: Code duplicated, block: B:209:0x0f45  */
    public final void i() {
        tr6 tr6Var;
        m2f m2fVar;
        xi10 xi10Var;
        boolean zBooleanValue;
        o9r o9rVar;
        wmv wmvVar;
        lw2 lw2VarB;
        j03 j03Var;
        env envVarA;
        sw50 sw50VarA;
        i7l i7lVar;
        jo0 jo0Var;
        j03 j03Var2;
        qi20 qi20VarH;
        qi20 qi20Var;
        dhf dhfVarE;
        dhf dhfVar;
        nij nijVar = nij.f;
        v5p v5pVar = this.B0;
        if (v5pVar == null) {
            Intrinsics.k("metricsUtil");
            throw null;
        }
        ((rea) v5pVar).f("bluetooth_permissions_enabled", String.valueOf(zh1.n(this)));
        v5p v5pVar2 = this.B0;
        if (v5pVar2 == null) {
            Intrinsics.k("metricsUtil");
            throw null;
        }
        Object systemService = getSystemService("bluetooth");
        BluetoothAdapter adapter = systemService != null ? ((BluetoothManager) systemService).getAdapter() : null;
        ((rea) v5pVar2).f("bluetooth_enabled", String.valueOf(adapter != null && adapter.isEnabled()));
        IntentFilter intentFilter = new IntentFilter();
        intentFilter.addAction("android.net.conn.CONNECTIVITY_CHANGE");
        intentFilter.addAction("android.intent.action.SCREEN_ON");
        intentFilter.addAction("android.location.MODE_CHANGED");
        intentFilter.addAction("android.location.PROVIDERS_CHANGED");
        intentFilter.addAction("android.os.action.POWER_SAVE_MODE_CHANGED");
        intentFilter.addAction("android.intent.action.ACTION_POWER_CONNECTED");
        intentFilter.addAction("android.intent.action.ACTION_POWER_DISCONNECTED");
        intentFilter.addAction("android.intent.action.AIRPLANE_MODE");
        intentFilter.addAction("android.intent.action.BATTERY_LOW");
        intentFilter.addAction("android.intent.action.BATTERY_OKAY");
        intentFilter.addAction("android.intent.action.ACTION_SHUTDOWN");
        intentFilter.addAction("android.intent.action.DOCK_EVENT");
        intentFilter.addAction(getPackageName() + ".SharedIntents.ACTION_FEATURE_FLAGS_UPDATED");
        intentFilter.addAction(getPackageName() + ".SharedIntents.ACTION_PLACE_ADDED");
        intentFilter.addAction(getPackageName() + ".SharedIntents.ACTION_PLACE_DELETED");
        intentFilter.addAction(getPackageName() + ".SharedIntents.ACTION_PLACE_UPDATED");
        intentFilter.addAction(getPackageName() + ".SharedIntents.ACTION_LEAVE_CIRCLE");
        intentFilter.addAction(getPackageName() + ".SharedIntents.ACTION_ACTIVE_CIRCLE_PLACES");
        intentFilter.addAction(getPackageName() + ".SharedIntents.ACTION_CIRCLE_JOINED");
        byte b = 28;
        if (k()) {
            Set set = tim.a;
            imd imdVar = new imd(b);
            CopyOnWriteArraySet copyOnWriteArraySet = oom.a;
            oom.a(new ajm(nijVar), ojm.INFO, "EventController", null, imdVar);
            intentFilter.addAction("android.intent.action.TIME_SET");
            intentFilter.addAction(getPackageName() + ".SharedIntents.ACTION_HEARTBEAT_TIMER");
            intentFilter.addAction(getPackageName() + ".Life360BaseApplication.ACTION_APP_TO_BACKGROUND");
            intentFilter.addAction(getPackageName() + ".SharedIntents.ACTION_DRIVE_END");
            intentFilter.addAction(getPackageName() + ".SharedIntents.ACTION_DRIVE_START");
            intentFilter.addAction(getPackageName() + ".SharedIntents.ACTION_ZONES_STREAM_CHANGED");
            intentFilter.addAction(getPackageName() + ".SharedIntents.ACTION_ZONE_EXPIRED");
        }
        e8h0.O(this, this.N0, intentFilter, null, 4);
        bth bthVarA = rf1.a(this.d.getLooper());
        rtx rtxVar = new rtx(this);
        this.i = rtxVar;
        qgh qghVar = rgh.Companion;
        m();
        qghVar.a(this);
        Set set2 = tim.a;
        jke.d(nijVar, "EventController", new hs(this, (byte) 11));
        xi10 xi10Var2 = new xi10(this, rtxVar, a(), n());
        this.j = xi10Var2;
        j03 j03Var3 = this.s0;
        if (j03Var3 == null) {
            Intrinsics.k("backgroundLocationTracker");
            throw null;
        }
        tcm tcmVar = new tcm(this, j03Var3, a());
        this.q = tcmVar;
        o9r o9rVarQ = this.h;
        if (o9rVarQ == null) {
            o9rVarQ = q();
        }
        xov xovVarO = tcmVar.o(o9rVarQ);
        ja7 ja7Var = this.b;
        dar darVarA = xovVarO.A(bthVarA);
        final iud iudVar = new iud(this, (byte) 3);
        final byte b2 = 7;
        fq7 fq7Var = new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b3 = b2;
                Function1 function1 = iudVar;
                switch (b3) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        };
        final ked kedVar = new ked((byte) 26);
        final byte b3 = 18;
        fq7 fq7Var2 = new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b4 = b3;
                Function1 function1 = kedVar;
                switch (b4) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        };
        tvw tvwVar = yid0.d;
        wh20 wh20Var = yid0.e;
        ja7Var.c(darVarA.G(fq7Var, fq7Var2, tvwVar, wh20Var));
        xov xovVarR = xi10Var2.r(o9rVarQ);
        ja7 ja7Var2 = this.b;
        dar darVarA2 = xovVarR.A(bthVarA);
        final iud iudVar2 = new iud(this, b2);
        final byte b4 = 29;
        ja7Var2.c(darVarA2.G(new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b5 = b4;
                Function1 function1 = iudVar2;
                switch (b5) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        }, new nud(new mud((byte) 7), (byte) 9), tvwVar, wh20Var));
        this.b.c(rtxVar.s(o9rVarQ).A(bthVarA).G(new nud(new iud(this, (byte) 17), (byte) 27), new tud((byte) 8, new mud((byte) 20)), tvwVar, wh20Var));
        gry gryVar = new gry(this, a(), (u3g) this.c.getValue());
        this.k = gryVar;
        if (xi10Var2.i == null) {
            xi10Var2.o();
        }
        xov xovVarG = gryVar.g(xi10Var2.i);
        ja7 ja7Var3 = this.b;
        dar darVarA3 = xovVarG.A(bthVarA);
        final gud gudVar = new gud(this, xi10Var2, (byte) 0);
        final byte b5 = 5;
        fq7 fq7Var3 = new fq7() { // from class: hud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b6 = b5;
                Function1 function1 = gudVar;
                switch (b6) {
                    case 0:
                        int i = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((gud) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((gud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                }
            }
        };
        final ked kedVar2 = new ked((byte) 10);
        final byte b6 = 16;
        ja7Var3.c(darVarA3.G(fq7Var3, new fq7() { // from class: hud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b7 = b6;
                Function1 function1 = kedVar2;
                switch (b7) {
                    case 0:
                        int i = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((gud) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((gud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                }
            }
        }, tvwVar, wh20Var));
        if (gryVar.g == null) {
            gryVar.f();
        }
        xov xovVarP = tcmVar.p(gryVar.g);
        ja7 ja7Var4 = this.b;
        dar darVarA4 = xovVarP.A(bthVarA);
        final cic cicVar = new cic((Object) this, (Object) gryVar, (byte) 3);
        final byte b7 = 26;
        fq7 fq7Var4 = new fq7() { // from class: hud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b8 = b7;
                Function1 function1 = cicVar;
                switch (b8) {
                    case 0:
                        int i = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((gud) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((gud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                }
            }
        };
        final ked kedVar3 = new ked((byte) 18);
        final byte b8 = 27;
        ja7Var4.c(darVarA4.G(fq7Var4, new fq7() { // from class: hud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b9 = b8;
                Function1 function1 = kedVar3;
                switch (b9) {
                    case 0:
                        int i = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((gud) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((gud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                }
            }
        }, tvwVar, wh20Var));
        m2f m2fVar2 = new m2f(this, rtxVar, n());
        this.l = m2fVar2;
        if (tcmVar.i == null) {
            tcmVar.n();
        }
        xov xovVarM = m2fVar2.m(tcmVar.i);
        ja7 ja7Var5 = this.b;
        dar darVarA5 = xovVarM.A(bthVarA);
        final fud fudVar = new fud(this, tcmVar, (byte) 1);
        final byte b9 = 28;
        fq7 fq7Var5 = new fq7() { // from class: hud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b10 = b9;
                Function1 function1 = fudVar;
                switch (b10) {
                    case 0:
                        int i = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((gud) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((gud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                }
            }
        };
        final ked kedVar4 = new ked((byte) 19);
        final byte b10 = 29;
        ja7Var5.c(darVarA5.G(fq7Var5, new fq7() { // from class: hud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b11 = b10;
                Function1 function1 = kedVar4;
                switch (b11) {
                    case 0:
                        int i = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((gud) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((gud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                }
            }
        }, tvwVar, wh20Var));
        if (((Boolean) tef.v(GateFlag.SrtP2pEnabled.INSTANCE, null, null, 7)).booleanValue()) {
            vz1 vz1VarA = a();
            lx40 lx40Var = this.E0;
            if (lx40Var == null) {
                Intrinsics.k("timeHelper");
                throw null;
            }
            tr6Var = new tr6(this, vz1VarA, lx40Var);
        } else {
            tr6Var = null;
        }
        add0 add0Var = new add0((byte) 15, (Object) this);
        yr50 yr50Var = new yr50(this, b(), add0Var, a());
        this.m = yr50Var;
        if (m2fVar2.m == null) {
            m2fVar2.k();
        }
        xov xovVarH = yr50Var.h(m2fVar2.m);
        ja7 ja7Var6 = this.b;
        dar darVarA6 = xovVarH.A(bthVarA);
        final jud judVar = new jud(this, m2fVar2, (byte) 4);
        final byte b11 = 0;
        fq7 fq7Var6 = new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b12 = b11;
                Function1 function1 = judVar;
                switch (b12) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        };
        final ked kedVar5 = new ked((byte) 20);
        final byte b12 = 1;
        ja7Var6.c(darVarA6.G(fq7Var6, new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b13 = b12;
                Function1 function1 = kedVar5;
                switch (b13) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        }, tvwVar, wh20Var));
        ue3 ue3Var = this.i0;
        if (ue3Var == null) {
            Intrinsics.k("batteryStatsWakeLockFactory");
            throw null;
        }
        vz1 vz1VarA2 = a();
        boolean zBooleanValue2 = ((Boolean) g().a.getValue()).booleanValue();
        boolean zN = n();
        o9r o9rVar2 = o9rVarQ;
        j03 j03Var4 = this.s0;
        if (j03Var4 == null) {
            Intrinsics.k("backgroundLocationTracker");
            throw null;
        }
        vam vamVar = this.D0;
        if (vamVar == null) {
            Intrinsics.k("locationPlatform");
            throw null;
        }
        kr50 kr50Var = new kr50(this, ue3Var, vz1VarA2, zBooleanValue2, zN, tr6Var, j03Var4, vamVar);
        this.n = kr50Var;
        o9r o9rVarF = yr50Var.j;
        if (o9rVarF == null) {
            o9rVarF = yr50Var.f();
        }
        xov xovVarM2 = kr50Var.m(o9rVarF);
        ja7 ja7Var7 = this.b;
        dar darVarA7 = xovVarM2.A(bthVarA);
        final lud ludVar = new lud(this, yr50Var, (byte) 0);
        final byte b13 = 2;
        fq7 fq7Var7 = new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b14 = b13;
                Function1 function1 = ludVar;
                switch (b14) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        };
        final ked kedVar6 = new ked((byte) 21);
        final byte b14 = 3;
        ja7Var7.c(darVarA7.G(fq7Var7, new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b15 = b14;
                Function1 function1 = kedVar6;
                switch (b15) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        }, tvwVar, wh20Var));
        h820 h820Var = this.u0;
        if (h820Var == null) {
            Intrinsics.k("systemEventTopicProvider");
            throw null;
        }
        wq wqVar = this.J0;
        if (wqVar == null) {
            Intrinsics.k("activeModalityTopicProvider");
            throw null;
        }
        oz1 oz1Var = oz1.a;
        lw2 lw2VarB2 = b();
        vz1 vz1VarA3 = a();
        i510 i510Var = this.n0;
        if (i510Var == null) {
            Intrinsics.k("srtMemberOutboundDataBuilder");
            throw null;
        }
        byte b15 = 2;
        yhh yhhVar = new yhh(this, h820Var, wqVar, lw2VarB2, add0Var, vz1VarA3, i510Var);
        this.o = yhhVar;
        if (yhhVar.t) {
            p710 p710Var = yhhVar.q;
            if (p710Var != null) {
                p710Var.a(null);
            }
            yhhVar.q = pv1.J(oz1Var, null, null, new qoa(yhhVar, null, (byte) 18), 3);
        }
        o9r o9rVarF2 = yr50Var.j;
        if (o9rVarF2 == null) {
            o9rVarF2 = yr50Var.f();
        }
        xov xovVarH2 = yhhVar.h(o9rVarF2);
        ja7 ja7Var8 = this.b;
        dar darVarA8 = xovVarH2.A(bthVarA);
        final lud ludVar2 = new lud(this, yr50Var, (byte) 1);
        final byte b16 = 4;
        fq7 fq7Var8 = new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b17 = b16;
                Function1 function1 = ludVar2;
                switch (b17) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        };
        final ked kedVar7 = new ked((byte) 22);
        final byte b17 = 5;
        ja7Var8.c(darVarA8.G(fq7Var8, new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b18 = b17;
                Function1 function1 = kedVar7;
                switch (b18) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        }, tvwVar, wh20Var));
        wdm wdmVar = new wdm(this, ((Boolean) this.S.getValue()).booleanValue(), a());
        this.f1006p = wdmVar;
        wdmVar.g();
        ArrayList arrayList = new ArrayList();
        if (kr50Var.j == null) {
            kr50Var.i();
        }
        o9r o9rVar3 = kr50Var.j;
        o9rVar3.getClass();
        arrayList.add(new u9r(o9rVar3, (byte) 0));
        u7r u7rVarG = yhhVar.n;
        if (u7rVarG == null) {
            u7rVarG = yhhVar.g();
        }
        arrayList.add(u7rVarG);
        xov xovVarI = wdmVar.i(arrayList);
        ja7 ja7Var9 = this.b;
        dar darVarA9 = xovVarI.A(bthVarA);
        final eud eudVar = new eud(this, kr50Var, wdmVar, b15);
        final byte b18 = 6;
        fq7 fq7Var9 = new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b19 = b18;
                Function1 function1 = eudVar;
                switch (b19) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        };
        final ked kedVar8 = new ked((byte) 23);
        final byte b19 = 8;
        ja7Var9.c(darVarA9.G(fq7Var9, new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b110 = b19;
                Function1 function1 = kedVar8;
                switch (b110) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        }, tvwVar, wh20Var));
        z(xi10Var2, wdmVar);
        if (((Boolean) this.X.getValue()).booleanValue()) {
            y(xi10Var2.i());
        }
        if (m()) {
            qghVar.a(this);
            ue3 ue3Var2 = this.i0;
            if (ue3Var2 == null) {
                Intrinsics.k("batteryStatsWakeLockFactory");
                throw null;
            }
            vz1 vz1VarA4 = a();
            sdm sdmVar = this.C;
            if (sdmVar == null) {
                Intrinsics.k("locationSendPriorityManager");
                throw null;
            }
            lgh lghVar = new lgh(this, ue3Var2, vz1VarA4, rtxVar, sdmVar);
            this.B = lghVar;
            xov xovVarK = lghVar.k(o9rVar2);
            ja7 ja7Var10 = this.b;
            dar darVarA10 = xovVarK.A(bthVarA);
            final iud iudVar3 = new iud(this, (byte) 4);
            final byte b20 = 9;
            fq7 fq7Var10 = new fq7() { // from class: kud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b20;
                    Function1 function1 = iudVar3;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((lud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((lud) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((mud) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((mud) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((mud) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((mud) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                    }
                }
            };
            final ked kedVar9 = new ked((byte) 24);
            final byte b21 = 10;
            ja7Var10.c(darVarA10.G(fq7Var10, new fq7() { // from class: kud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b21;
                    Function1 function1 = kedVar9;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((lud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((lud) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((mud) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((mud) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((mud) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((mud) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                    }
                }
            }, tvwVar, wh20Var));
            m2fVar = m2fVar2;
            if (m2fVar.m == null) {
                m2fVar.k();
            }
            xov xovVarL = lghVar.l(m2fVar.m);
            ja7 ja7Var11 = this.b;
            dar darVarA11 = xovVarL.A(bthVarA);
            final jud judVar2 = new jud(this, m2fVar, (byte) 5);
            final byte b22 = 11;
            fq7 fq7Var11 = new fq7() { // from class: kud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b22;
                    Function1 function1 = judVar2;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((lud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((lud) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((mud) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((mud) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((mud) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((mud) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                    }
                }
            };
            final ked kedVar10 = new ked((byte) 25);
            final byte b23 = 12;
            ja7Var11.c(darVarA11.G(fq7Var11, new fq7() { // from class: kud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b23;
                    Function1 function1 = kedVar10;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((lud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((lud) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((mud) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((mud) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((mud) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((mud) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                    }
                }
            }, tvwVar, wh20Var));
        } else {
            m2fVar = m2fVar2;
        }
        xov xovVarQ = xi10Var2.q((o9r) wdmVar.f());
        ja7 ja7Var12 = this.b;
        dar darVarA12 = xovVarQ.A(bthVarA);
        final eud eudVar2 = new eud(this, kr50Var, wdmVar, (byte) 3);
        final byte b24 = 13;
        fq7 fq7Var12 = new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b110 = b24;
                Function1 function1 = eudVar2;
                switch (b110) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        };
        final ked kedVar11 = new ked((byte) 27);
        final byte b25 = 14;
        ja7Var12.c(darVarA12.G(fq7Var12, new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b110 = b25;
                Function1 function1 = kedVar11;
                switch (b110) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        }, tvwVar, wh20Var));
        vz1 vz1VarA5 = a();
        lsz lszVar = this.y0;
        if (lszVar == null) {
            Intrinsics.k("placeGeofenceRegistrarFactory");
            throw null;
        }
        vsg vsgVar = this.z0;
        if (vsgVar == null) {
            Intrinsics.k("geofencePrefsStore");
            throw null;
        }
        vam vamVar2 = this.D0;
        if (vamVar2 == null) {
            Intrinsics.k("locationPlatform");
            throw null;
        }
        asg asgVar = new asg(this, rtxVar, vz1VarA5, lszVar, vsgVar, vamVar2);
        this.r = asgVar;
        xov xovVarR2 = asgVar.r((o9r) wdmVar.f());
        ja7 ja7Var13 = this.b;
        dar darVarA13 = xovVarR2.A(bthVarA);
        final eud eudVar3 = new eud(this, kr50Var, wdmVar, (byte) 4);
        final byte b26 = 15;
        fq7 fq7Var13 = new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b110 = b26;
                Function1 function1 = eudVar3;
                switch (b110) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        };
        final ked kedVar12 = new ked((byte) 28);
        final byte b27 = 16;
        fv80.A(ja7Var13, (c2l) darVarA13.G(fq7Var13, new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b110 = b27;
                Function1 function1 = kedVar12;
                switch (b110) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        }, tvwVar, wh20Var));
        xov xovVarP2 = asgVar.p(o9rVar2);
        ja7 ja7Var14 = this.b;
        dar darVarA14 = xovVarP2.A(bthVarA);
        final iud iudVar4 = new iud(this, (byte) 5);
        final byte b28 = 17;
        fq7 fq7Var14 = new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b110 = b28;
                Function1 function1 = iudVar4;
                switch (b110) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        };
        final ked kedVar13 = new ked((byte) 29);
        final byte b29 = 19;
        fv80.A(ja7Var14, (c2l) darVarA14.F(fq7Var14, new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b110 = b29;
                Function1 function1 = kedVar13;
                switch (b110) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        }));
        xov xovVarQ2 = asgVar.q(tcmVar.f());
        ja7 ja7Var15 = this.b;
        dar darVarA15 = xovVarQ2.A(bthVarA);
        final cic cicVar2 = new cic(this, asgVar, tcmVar);
        final byte b30 = 20;
        fq7 fq7Var15 = new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b110 = b30;
                Function1 function1 = cicVar2;
                switch (b110) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        };
        final mud mudVar = new mud((byte) 0);
        final byte b31 = 21;
        fv80.A(ja7Var15, (c2l) darVarA15.F(fq7Var15, new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b110 = b31;
                Function1 function1 = mudVar;
                switch (b110) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        }));
        asgVar.s();
        om60 om60Var = new om60(this, rtxVar);
        this.s = om60Var;
        xov xovVarG2 = om60Var.g(o9rVar2);
        ja7 ja7Var16 = this.b;
        dar darVarA16 = xovVarG2.A(bthVarA);
        final iud iudVar5 = new iud(this, (byte) 6);
        final byte b32 = 22;
        fq7 fq7Var16 = new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b110 = b32;
                Function1 function1 = iudVar5;
                switch (b110) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        };
        final mud mudVar2 = new mud((byte) 1);
        final byte b33 = 23;
        fv80.A(ja7Var16, (c2l) darVarA16.F(fq7Var16, new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b110 = b33;
                Function1 function1 = mudVar2;
                switch (b110) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        }));
        if (m2fVar.h == null) {
            m2fVar.j();
        }
        om60Var.f = m2fVar.h;
        if (om60Var.h) {
            om60Var.f();
        }
        xov xovVar = om60Var.j;
        ja7 ja7Var17 = this.b;
        dar darVarA17 = xovVar.A(bthVarA);
        final jud judVar3 = new jud(this, m2fVar, (byte) 6);
        final byte b34 = 24;
        fq7 fq7Var17 = new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b110 = b34;
                Function1 function1 = judVar3;
                switch (b110) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        };
        final mud mudVar3 = new mud((byte) 2);
        final byte b35 = 25;
        fv80.A(ja7Var17, (c2l) darVarA17.F(fq7Var17, new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b110 = b35;
                Function1 function1 = mudVar3;
                switch (b110) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        }));
        if (tcmVar.i == null) {
            tcmVar.n();
        }
        xov xovVarT = rtxVar.t(tcmVar.i);
        ja7 ja7Var18 = this.b;
        dar darVarA18 = xovVarT.A(bthVarA);
        final fud fudVar2 = new fud(this, tcmVar, (byte) 2);
        final byte b36 = 26;
        fq7 fq7Var18 = new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b110 = b36;
                Function1 function1 = fudVar2;
                switch (b110) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        };
        final mud mudVar4 = new mud((byte) 3);
        final byte b37 = 27;
        fv80.A(ja7Var18, (c2l) darVarA18.F(fq7Var18, new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b110 = b37;
                Function1 function1 = mudVar4;
                switch (b110) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        }));
        if (m2fVar.h == null) {
            m2fVar.j();
        }
        xov xovVarR3 = rtxVar.r(m2fVar.h);
        ja7 ja7Var19 = this.b;
        dar darVarA19 = xovVarR3.A(bthVarA);
        final jud judVar4 = new jud(this, m2fVar, (byte) 7);
        final byte b38 = 28;
        fv80.A(ja7Var19, (c2l) darVarA19.F(new fq7() { // from class: kud
            @Override // defpackage.fq7
            public final void accept(Object obj) throws Exception {
                byte b110 = b38;
                Function1 function1 = judVar4;
                switch (b110) {
                    case 0:
                        int i = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 1:
                        int i2 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 2:
                        int i3 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 3:
                        int i4 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 4:
                        int i5 = EventController.O0;
                        ((lud) function1).invoke(obj);
                        break;
                    case 5:
                        int i6 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 6:
                        int i7 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 7:
                        int i8 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 8:
                        int i9 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 9:
                        int i10 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 10:
                        int i11 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 11:
                        int i12 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 12:
                        int i13 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 13:
                        int i14 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 14:
                        int i15 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 15:
                        int i16 = EventController.O0;
                        ((eud) function1).invoke(obj);
                        break;
                    case 16:
                        int i17 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 17:
                        int i18 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 18:
                        int i19 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 19:
                        int i20 = EventController.O0;
                        ((ked) function1).invoke(obj);
                        break;
                    case 20:
                        int i21 = EventController.O0;
                        ((cic) function1).invoke(obj);
                        break;
                    case 21:
                        int i22 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 22:
                        int i23 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                    case 23:
                        int i24 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 24:
                        int i25 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    case 25:
                        int i26 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 26:
                        int i27 = EventController.O0;
                        ((fud) function1).invoke(obj);
                        break;
                    case 27:
                        int i28 = EventController.O0;
                        ((mud) function1).invoke(obj);
                        break;
                    case 28:
                        int i29 = EventController.O0;
                        ((jud) function1).invoke(obj);
                        break;
                    default:
                        int i30 = EventController.O0;
                        ((iud) function1).invoke(obj);
                        break;
                }
            }
        }, new nud(new mud((byte) 4), (byte) 0)));
        byte b39 = 5;
        fv80.A(this.b, (c2l) rtxVar.u((o9r) wdmVar.f()).A(bthVarA).F(new nud(new eud(this, kr50Var, wdmVar, b39), (byte) 1), new nud(new mud(b39), (byte) 2)));
        a();
        vam vamVar3 = this.D0;
        if (vamVar3 == null) {
            Intrinsics.k("locationPlatform");
            throw null;
        }
        q03 q03VarI = q03.i(this, vamVar3);
        this.t = q03VarI;
        fv80.A(this.b, (c2l) q03VarI.r(o9rVar2).A(bthVarA).F(new nud(new iud(this, (byte) 8), (byte) 3), new nud(new mud((byte) 6), (byte) 4)));
        uu uuVar = new uu(this);
        this.u = uuVar;
        fv80.A(this.b, (c2l) uuVar.e(o9rVar2).A(bthVarA).F(new nud(new iud(this, (byte) 9), (byte) 5), new nud(new mud((byte) 8), (byte) 6)));
        Set set3 = tim.a;
        jke.d(nijVar, "EventController", new hs(this, (byte) 15));
        if (!k()) {
            kv9 kv9Var = new kv9(this, rtxVar);
            this.v = kv9Var;
            fv80.A(this.b, (c2l) kv9Var.k(o9rVar2).A(bthVarA).F(new nud(new iud(this, (byte) 10), (byte) 7), new nud(new mud((byte) 9), (byte) 8)));
            fv80.A(this.b, (c2l) kv9Var.c((o9r) wdmVar.f()).A(bthVarA).F(new nud(new eud(this, kr50Var, wdmVar, (byte) 6), (byte) 17), new nud(new mud((byte) 13), (byte) 18)));
        }
        if (((Boolean) this.L.getValue()).booleanValue()) {
            jke.d(nijVar, "EventController", new hs(this, (byte) 27));
            if (k()) {
                CasperRemoteFlagProvider casperRemoteFlagProvider = this.A0;
                if (casperRemoteFlagProvider == null) {
                    Intrinsics.k("casperRemoteFlagProvider");
                    throw null;
                }
                ud7 ud7Var = new ud7(this, casperRemoteFlagProvider);
                this.x = ud7Var;
                fv80.A(this.b, (c2l) ud7Var.l(o9rVar2).A(bthVarA).F(new nud(new iud(this, (byte) 16), (byte) 19), new nud(new mud((byte) 14), (byte) 20)));
                xi10Var = xi10Var2;
                if (xi10Var.i == null) {
                    xi10Var.o();
                }
                fv80.A(this.b, (c2l) ud7Var.m(xi10Var.i).A(bthVarA).F(new nud(new gud(this, xi10Var, (byte) 2), (byte) 21), new nud(new mud((byte) 15), (byte) 22)));
                izh izhVar = new izh(this);
                this.y = izhVar;
                fv80.A(this.b, (c2l) izhVar.b(o9rVar2).A(bthVarA).F(new nud(new iud(this, (byte) 18), (byte) 23), new nud(new mud((byte) 16), (byte) 24)));
            } else {
                xi10Var = xi10Var2;
                if (tlb0.G(this)) {
                    izh.c(this, "EventController");
                }
                CasperRemoteFlagProvider casperRemoteFlagProvider2 = this.A0;
                if (casperRemoteFlagProvider2 == null) {
                    Intrinsics.k("casperRemoteFlagProvider");
                    throw null;
                }
                j9a0 j9a0Var = new j9a0(this, casperRemoteFlagProvider2);
                this.w = j9a0Var;
                fv80.A(this.b, (c2l) j9a0Var.s(o9rVar2).A(bthVarA).F(new nud(new iud(this, (byte) 19), (byte) 25), new nud(new mud((byte) 17), (byte) 26)));
                if (xi10Var.i == null) {
                    xi10Var.o();
                }
                fv80.A(this.b, (c2l) j9a0Var.t(xi10Var.i).A(bthVarA).F(new nud(new gud(this, xi10Var, (byte) 3), (byte) 28), new nud(new mud((byte) 18), (byte) 29)));
            }
            if (n()) {
                z6m z6mVar = new z6m(this, rtxVar);
                this.z = z6mVar;
                fv80.A(this.b, (c2l) z6mVar.j(xi10Var.h()).A(bthVarA).F(new tud((byte) 0, new gud(this, xi10Var, (byte) 4)), new tud((byte) 1, new mud((byte) 19))));
                fv80.A(this.b, (c2l) z6mVar.h(m2fVar.f()).A(bthVarA).F(new tud((byte) 2, new jud(this, m2fVar, (byte) 8)), new tud((byte) 3, new mud((byte) 21))));
                byte b40 = 5;
                fv80.A(this.b, (c2l) z6mVar.k(kr50Var.f()).A(bthVarA).F(new tud((byte) 4, new cic(this, kr50Var, b40)), new tud(b40, new mud((byte) 22))));
                byte b41 = 7;
                fv80.A(this.b, (c2l) z6mVar.i((o9r) wdmVar.f()).A(bthVarA).F(new tud((byte) 6, new eud(this, kr50Var, wdmVar, b41)), new tud(b41, new mud((byte) 23))));
            }
            n090 n090Var = new n090(this, rtxVar);
            this.A = n090Var;
            fv80.A(this.b, (c2l) n090Var.g((o9r) wdmVar.f()).A(bthVarA).F(new tud((byte) 9, new eud(this, kr50Var, wdmVar, (byte) 8)), new hea((byte) 27, (Object) new mud((byte) 24))));
            jke.d(nijVar, "EventController", new hs(this, (byte) 6));
            hj70 hj70Var = new hj70(this, b(), add0Var, a());
            this.D = hj70Var;
            fv80.A(this.b, (c2l) hj70Var.f((o9r) wdmVar.f()).A(bthVarA).F(new hea((byte) 28, (Object) new eud(this, kr50Var, wdmVar, (byte) 0)), new hea((byte) 29, (Object) new ked((byte) 3))));
            if (this.J == null) {
                jgf jgfVar = new jgf(new mhh(this, a()), a());
                qi20VarH = h();
                if (j()) {
                    qi20Var = qi20VarH;
                } else {
                    qi20Var = null;
                }
                dhfVarE = e();
                if (j()) {
                    dhfVar = dhfVarE;
                } else {
                    dhfVar = null;
                }
                fgf fgfVar = new fgf(this, jgfVar, a(), qi20Var, dhfVar);
                this.J = fgfVar;
                if (tcmVar.i == null) {
                    tcmVar.n();
                }
                xov xovVarK2 = fgfVar.k(tcmVar.i);
                ja7 ja7Var20 = this.b;
                dar darVarA20 = xovVarK2.A(bthVarA);
                final byte b42 = 0;
                final fud fudVar3 = new fud(this, tcmVar, b42);
                fq7 fq7Var19 = new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b42;
                        Function1 function1 = fudVar3;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                };
                final ked kedVar14 = new ked((byte) 4);
                final byte b43 = 1;
                fv80.A(ja7Var20, (c2l) darVarA20.F(fq7Var19, new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b43;
                        Function1 function1 = kedVar14;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                }));
                xov xovVarL2 = fgfVar.l((o9r) wdmVar.f());
                ja7 ja7Var21 = this.b;
                dar darVarA21 = xovVarL2.A(bthVarA);
                final eud eudVar4 = new eud(this, kr50Var, wdmVar, b43);
                final byte b44 = 2;
                fq7 fq7Var20 = new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b44;
                        Function1 function1 = eudVar4;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                };
                final ked kedVar15 = new ked((byte) 5);
                final byte b45 = 3;
                fv80.A(ja7Var21, (c2l) darVarA21.F(fq7Var20, new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b45;
                        Function1 function1 = kedVar15;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                }));
                xov xovVar2 = fgfVar.w;
                ja7 ja7Var22 = this.b;
                dar darVarA22 = xovVar2.A(bthVarA);
                final byte b46 = 6;
                final ked kedVar16 = new ked(b46);
                final byte b47 = 4;
                fq7 fq7Var21 = new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b47;
                        Function1 function1 = kedVar16;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                };
                final ked kedVar17 = new ked((byte) 7);
                fv80.A(ja7Var22, (c2l) darVarA22.F(fq7Var21, new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b46;
                        Function1 function1 = kedVar17;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                }));
            }
            zBooleanValue = ((Boolean) this.N.getValue()).booleanValue();
            if (!zBooleanValue || ((Boolean) this.O.getValue()).booleanValue()) {
                final byte b48 = 7;
                y7u y7uVar = new y7u(this, d(), zBooleanValue, a(), ((Boolean) tef.v(GateFlag.CapLocationAllowListEnabled.INSTANCE, null, null, 7)).booleanValue());
                this.E = y7uVar;
                o9rVar = r9;
                xov xovVarH3 = y7uVar.h(o9rVar);
                ja7 ja7Var23 = this.b;
                dar darVarA23 = xovVarH3.A(bthVarA);
                final iud iudVar6 = new iud(this, (byte) 0);
                fq7 fq7Var22 = new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b48;
                        Function1 function1 = iudVar6;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                };
                final byte b49 = 8;
                final ked kedVar18 = new ked(b49);
                fv80.A(ja7Var23, (c2l) darVarA23.F(fq7Var22, new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b49;
                        Function1 function1 = kedVar18;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                }));
                xov xovVarI2 = y7uVar.i(asgVar.r);
                ja7 ja7Var24 = this.b;
                dar darVarA24 = xovVarI2.A(bthVarA);
                final cic cicVar3 = new cic((Object) this, (Object) asgVar, (byte) 2);
                final byte b50 = 9;
                fq7 fq7Var23 = new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b50;
                        Function1 function1 = cicVar3;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                };
                final ked kedVar19 = new ked(b50);
                final byte b51 = 10;
                fv80.A(ja7Var24, (c2l) darVarA24.F(fq7Var23, new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b51;
                        Function1 function1 = kedVar19;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                }));
            } else {
                o9rVar = o9rVar2;
            }
            wmvVar = env.Companion;
            lw2VarB = b();
            j03Var = this.s0;
            if (j03Var != null) {
                Intrinsics.k("backgroundLocationTracker");
                throw null;
            }
            envVarA = wmvVar.a(this, lw2VarB, j03Var, a());
            if (((Boolean) this.P.getValue()).booleanValue()) {
                umv umvVar = new umv(this, envVarA, a(), rtxVar);
                this.F = umvVar;
                if (m2fVar.h == null) {
                    m2fVar.j();
                }
                xov xovVarK3 = umvVar.k(m2fVar.h);
                ja7 ja7Var25 = this.b;
                dar darVarA25 = xovVarK3.A(bthVarA);
                final jud judVar5 = new jud(this, m2fVar, (byte) 0);
                final byte b52 = 11;
                fq7 fq7Var24 = new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b52;
                        Function1 function1 = judVar5;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                };
                final ked kedVar20 = new ked(b52);
                final byte b53 = 12;
                fv80.A(ja7Var25, (c2l) darVarA25.F(fq7Var24, new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b53;
                        Function1 function1 = kedVar20;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                }));
                xov xovVarL3 = umvVar.l(o9rVar);
                ja7 ja7Var26 = this.b;
                dar darVarA26 = xovVarL3.A(bthVarA);
                final iud iudVar7 = new iud(this, (byte) 1);
                final byte b54 = 13;
                fq7 fq7Var25 = new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b54;
                        Function1 function1 = iudVar7;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                };
                final ked kedVar21 = new ked((byte) 12);
                final byte b55 = 14;
                fv80.A(ja7Var26, (c2l) darVarA26.F(fq7Var25, new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b55;
                        Function1 function1 = kedVar21;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                }));
                umvVar.m();
            } else {
                pv1.J(oz1Var, null, null, new s8d((Object) envVarA, (cy7) null, (byte) 3), 3);
            }
            if (((Boolean) this.Q.getValue()).booleanValue()) {
                jo0Var = new jo0((byte) 22, (Object) a());
                j03Var2 = this.s0;
                if (j03Var2 != null) {
                    Intrinsics.k("backgroundLocationTracker");
                    throw null;
                }
                ugj ugjVar = new ugj(this, rtxVar, jo0Var, j03Var2);
                this.G = ugjVar;
                if (xi10Var.i == null) {
                    xi10Var.o();
                }
                xov xovVarH4 = ugjVar.h(xi10Var.i);
                ja7 ja7Var27 = this.b;
                dar darVarA27 = xovVarH4.A(bthVarA);
                final gud gudVar2 = new gud(this, xi10Var, (byte) 1);
                final byte b56 = 15;
                fq7 fq7Var26 = new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b56;
                        Function1 function1 = gudVar2;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                };
                final ked kedVar22 = new ked((byte) 13);
                final byte b57 = 17;
                fv80.A(ja7Var27, (c2l) darVarA27.F(fq7Var26, new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b57;
                        Function1 function1 = kedVar22;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                }));
                if (m2fVar.m == null) {
                    m2fVar.k();
                }
                xov xovVarG3 = ugjVar.g(m2fVar.m);
                ja7 ja7Var28 = this.b;
                dar darVarA28 = xovVarG3.A(bthVarA);
                final jud judVar6 = new jud(this, m2fVar, (byte) 1);
                final byte b58 = 18;
                fq7 fq7Var27 = new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b58;
                        Function1 function1 = judVar6;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                };
                final ked kedVar23 = new ked((byte) 14);
                final byte b59 = 19;
                fv80.A(ja7Var28, (c2l) darVarA28.F(fq7Var27, new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b59;
                        Function1 function1 = kedVar23;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                }));
            }
            if (l()) {
                pvk pvkVar = new pvk(this, f());
                this.H = pvkVar;
                if (m2fVar.h == null) {
                    m2fVar.j();
                }
                xov xovVarG4 = pvkVar.g(m2fVar.h);
                ja7 ja7Var29 = this.b;
                dar darVarA29 = xovVarG4.A(bthVarA);
                final jud judVar7 = new jud(this, m2fVar, (byte) 2);
                final byte b60 = 20;
                fq7 fq7Var28 = new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b60;
                        Function1 function1 = judVar7;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                };
                final ked kedVar24 = new ked((byte) 15);
                final byte b61 = 21;
                fv80.A(ja7Var29, (c2l) darVarA29.F(fq7Var28, new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b61;
                        Function1 function1 = kedVar24;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                }));
            }
            sw50VarA = sw50.Companion.a(this, a());
            if (((Boolean) this.V.getValue()).booleanValue()) {
                zw50 zw50Var = new zw50(this, sw50VarA);
                this.I = zw50Var;
                xov xovVarH5 = zw50Var.h(o9rVar);
                ja7 ja7Var30 = this.b;
                dar darVarA30 = xovVarH5.A(bthVarA);
                final iud iudVar8 = new iud(this, (byte) 2);
                final byte b62 = 22;
                fq7 fq7Var29 = new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b62;
                        Function1 function1 = iudVar8;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                };
                final ked kedVar25 = new ked((byte) 16);
                final byte b63 = 23;
                fv80.A(ja7Var30, (c2l) darVarA30.F(fq7Var29, new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b63;
                        Function1 function1 = kedVar25;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                }));
                if (m2fVar.h == null) {
                    m2fVar.j();
                }
                xov xovVarG5 = zw50Var.g(m2fVar.h);
                ja7 ja7Var31 = this.b;
                dar darVarA31 = xovVarG5.A(bthVarA);
                final jud judVar8 = new jud(this, m2fVar, (byte) 3);
                final byte b64 = 24;
                fq7 fq7Var30 = new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b64;
                        Function1 function1 = judVar8;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                };
                final ked kedVar26 = new ked((byte) 17);
                final byte b65 = 25;
                fv80.A(ja7Var31, (c2l) darVarA31.F(fq7Var30, new fq7() { // from class: hud
                    @Override // defpackage.fq7
                    public final void accept(Object obj) throws Exception {
                        byte b110 = b65;
                        Function1 function1 = kedVar26;
                        switch (b110) {
                            case 0:
                                int i = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            case 1:
                                int i2 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 2:
                                int i3 = EventController.O0;
                                ((eud) function1).invoke(obj);
                                break;
                            case 3:
                                int i4 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 4:
                                int i5 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 5:
                                int i6 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 6:
                                int i7 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 7:
                                int i8 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 8:
                                int i9 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 9:
                                int i10 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 10:
                                int i11 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 11:
                                int i12 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 12:
                                int i13 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 13:
                                int i14 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 14:
                                int i15 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 15:
                                int i16 = EventController.O0;
                                ((gud) function1).invoke(obj);
                                break;
                            case 16:
                                int i17 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 17:
                                int i18 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 18:
                                int i19 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 19:
                                int i20 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 20:
                                int i21 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 21:
                                int i22 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 22:
                                int i23 = EventController.O0;
                                ((iud) function1).invoke(obj);
                                break;
                            case 23:
                                int i24 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 24:
                                int i25 = EventController.O0;
                                ((jud) function1).invoke(obj);
                                break;
                            case 25:
                                int i26 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 26:
                                int i27 = EventController.O0;
                                ((cic) function1).invoke(obj);
                                break;
                            case 27:
                                int i28 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                            case 28:
                                int i29 = EventController.O0;
                                ((fud) function1).invoke(obj);
                                break;
                            default:
                                int i30 = EventController.O0;
                                ((ked) function1).invoke(obj);
                                break;
                        }
                    }
                }));
            } else {
                sw50VarA.d();
            }
            b().a(c());
            xi10Var.p();
            if (j()) {
                i7lVar = this.v0;
                if (i7lVar != null) {
                    Intrinsics.k("activityRecognitionController");
                    throw null;
                }
                ((fu) i7lVar.get()).g(o9rVar);
            }
            jke.d(nijVar, "EventController", new imd((byte) 13));
        }
        xi10Var = xi10Var2;
        if (n()) {
            z6m z6mVar2 = new z6m(this, rtxVar);
            this.z = z6mVar2;
            fv80.A(this.b, (c2l) z6mVar2.j(xi10Var.h()).A(bthVarA).F(new tud((byte) 0, new gud(this, xi10Var, (byte) 4)), new tud((byte) 1, new mud((byte) 19))));
            fv80.A(this.b, (c2l) z6mVar2.h(m2fVar.f()).A(bthVarA).F(new tud((byte) 2, new jud(this, m2fVar, (byte) 8)), new tud((byte) 3, new mud((byte) 21))));
            byte b410 = 5;
            fv80.A(this.b, (c2l) z6mVar2.k(kr50Var.f()).A(bthVarA).F(new tud((byte) 4, new cic(this, kr50Var, b410)), new tud(b410, new mud((byte) 22))));
            byte b411 = 7;
            fv80.A(this.b, (c2l) z6mVar2.i((o9r) wdmVar.f()).A(bthVarA).F(new tud((byte) 6, new eud(this, kr50Var, wdmVar, b411)), new tud(b411, new mud((byte) 23))));
        }
        n090 n090Var2 = new n090(this, rtxVar);
        this.A = n090Var2;
        fv80.A(this.b, (c2l) n090Var2.g((o9r) wdmVar.f()).A(bthVarA).F(new tud((byte) 9, new eud(this, kr50Var, wdmVar, (byte) 8)), new hea((byte) 27, (Object) new mud((byte) 24))));
        jke.d(nijVar, "EventController", new hs(this, (byte) 6));
        hj70 hj70Var2 = new hj70(this, b(), add0Var, a());
        this.D = hj70Var2;
        fv80.A(this.b, (c2l) hj70Var2.f((o9r) wdmVar.f()).A(bthVarA).F(new hea((byte) 28, (Object) new eud(this, kr50Var, wdmVar, (byte) 0)), new hea((byte) 29, (Object) new ked((byte) 3))));
        if (this.J == null) {
            jgf jgfVar2 = new jgf(new mhh(this, a()), a());
            qi20VarH = h();
            if (j()) {
                qi20Var = qi20VarH;
            } else {
                qi20Var = null;
            }
            dhfVarE = e();
            if (j()) {
                dhfVar = dhfVarE;
            } else {
                dhfVar = null;
            }
            fgf fgfVar2 = new fgf(this, jgfVar2, a(), qi20Var, dhfVar);
            this.J = fgfVar2;
            if (tcmVar.i == null) {
                tcmVar.n();
            }
            xov xovVarK4 = fgfVar2.k(tcmVar.i);
            ja7 ja7Var210 = this.b;
            dar darVarA210 = xovVarK4.A(bthVarA);
            final byte b412 = 0;
            final Function1 fudVar4 = new fud(this, tcmVar, b412);
            fq7 fq7Var110 = new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b412;
                    Function1 function1 = fudVar4;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            };
            final Function1 kedVar110 = new ked((byte) 4);
            final byte b413 = 1;
            fv80.A(ja7Var210, (c2l) darVarA210.F(fq7Var110, new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b413;
                    Function1 function1 = kedVar110;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            }));
            xov xovVarL4 = fgfVar2.l((o9r) wdmVar.f());
            ja7 ja7Var211 = this.b;
            dar darVarA211 = xovVarL4.A(bthVarA);
            final Function1 eudVar5 = new eud(this, kr50Var, wdmVar, b413);
            final byte b414 = 2;
            fq7 fq7Var210 = new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b414;
                    Function1 function1 = eudVar5;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            };
            final Function1 kedVar111 = new ked((byte) 5);
            final byte b415 = 3;
            fv80.A(ja7Var211, (c2l) darVarA211.F(fq7Var210, new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b415;
                    Function1 function1 = kedVar111;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            }));
            xov xovVar3 = fgfVar2.w;
            ja7 ja7Var212 = this.b;
            dar darVarA212 = xovVar3.A(bthVarA);
            final byte b416 = 6;
            final Function1 kedVar112 = new ked(b416);
            final byte b417 = 4;
            fq7 fq7Var211 = new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b417;
                    Function1 function1 = kedVar112;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            };
            final Function1 kedVar113 = new ked((byte) 7);
            fv80.A(ja7Var212, (c2l) darVarA212.F(fq7Var211, new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b416;
                    Function1 function1 = kedVar113;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            }));
        }
        zBooleanValue = ((Boolean) this.N.getValue()).booleanValue();
        if (zBooleanValue) {
            final byte b418 = 7;
            y7u y7uVar2 = new y7u(this, d(), zBooleanValue, a(), ((Boolean) tef.v(GateFlag.CapLocationAllowListEnabled.INSTANCE, null, null, 7)).booleanValue());
            this.E = y7uVar2;
            o9rVar = r9;
            xov xovVarH6 = y7uVar2.h(o9rVar);
            ja7 ja7Var213 = this.b;
            dar darVarA213 = xovVarH6.A(bthVarA);
            final Function1 iudVar9 = new iud(this, (byte) 0);
            fq7 fq7Var212 = new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b418;
                    Function1 function1 = iudVar9;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            };
            final byte b419 = 8;
            final Function1 kedVar114 = new ked(b419);
            fv80.A(ja7Var213, (c2l) darVarA213.F(fq7Var212, new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b419;
                    Function1 function1 = kedVar114;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            }));
            xov xovVarI3 = y7uVar2.i(asgVar.r);
            ja7 ja7Var214 = this.b;
            dar darVarA214 = xovVarI3.A(bthVarA);
            final Function1 cicVar4 = new cic((Object) this, (Object) asgVar, (byte) 2);
            final byte b510 = 9;
            fq7 fq7Var213 = new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b510;
                    Function1 function1 = cicVar4;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            };
            final Function1 kedVar115 = new ked(b510);
            final byte b511 = 10;
            fv80.A(ja7Var214, (c2l) darVarA214.F(fq7Var213, new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b511;
                    Function1 function1 = kedVar115;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            }));
        } else {
            final byte b4110 = 7;
            y7u y7uVar3 = new y7u(this, d(), zBooleanValue, a(), ((Boolean) tef.v(GateFlag.CapLocationAllowListEnabled.INSTANCE, null, null, 7)).booleanValue());
            this.E = y7uVar3;
            o9rVar = r9;
            xov xovVarH7 = y7uVar3.h(o9rVar);
            ja7 ja7Var215 = this.b;
            dar darVarA215 = xovVarH7.A(bthVarA);
            final Function1 iudVar10 = new iud(this, (byte) 0);
            fq7 fq7Var214 = new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b4110;
                    Function1 function1 = iudVar10;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            };
            final byte b4111 = 8;
            final Function1 kedVar116 = new ked(b4111);
            fv80.A(ja7Var215, (c2l) darVarA215.F(fq7Var214, new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b4111;
                    Function1 function1 = kedVar116;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            }));
            xov xovVarI4 = y7uVar3.i(asgVar.r);
            ja7 ja7Var216 = this.b;
            dar darVarA216 = xovVarI4.A(bthVarA);
            final Function1 cicVar5 = new cic((Object) this, (Object) asgVar, (byte) 2);
            final byte b512 = 9;
            fq7 fq7Var215 = new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b512;
                    Function1 function1 = cicVar5;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            };
            final Function1 kedVar117 = new ked(b512);
            final byte b513 = 10;
            fv80.A(ja7Var216, (c2l) darVarA216.F(fq7Var215, new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b513;
                    Function1 function1 = kedVar117;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            }));
        }
        wmvVar = env.Companion;
        lw2VarB = b();
        j03Var = this.s0;
        if (j03Var != null) {
            Intrinsics.k("backgroundLocationTracker");
            throw null;
        }
        envVarA = wmvVar.a(this, lw2VarB, j03Var, a());
        if (((Boolean) this.P.getValue()).booleanValue()) {
            umv umvVar2 = new umv(this, envVarA, a(), rtxVar);
            this.F = umvVar2;
            if (m2fVar.h == null) {
                m2fVar.j();
            }
            xov xovVarK5 = umvVar2.k(m2fVar.h);
            ja7 ja7Var217 = this.b;
            dar darVarA217 = xovVarK5.A(bthVarA);
            final Function1 judVar9 = new jud(this, m2fVar, (byte) 0);
            final byte b514 = 11;
            fq7 fq7Var216 = new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b514;
                    Function1 function1 = judVar9;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            };
            final Function1 kedVar27 = new ked(b514);
            final byte b515 = 12;
            fv80.A(ja7Var217, (c2l) darVarA217.F(fq7Var216, new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b515;
                    Function1 function1 = kedVar27;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            }));
            xov xovVarL5 = umvVar2.l(o9rVar);
            ja7 ja7Var218 = this.b;
            dar darVarA218 = xovVarL5.A(bthVarA);
            final Function1 iudVar11 = new iud(this, (byte) 1);
            final byte b516 = 13;
            fq7 fq7Var217 = new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b516;
                    Function1 function1 = iudVar11;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            };
            final Function1 kedVar28 = new ked((byte) 12);
            final byte b517 = 14;
            fv80.A(ja7Var218, (c2l) darVarA218.F(fq7Var217, new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b517;
                    Function1 function1 = kedVar28;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            }));
            umvVar2.m();
        } else {
            pv1.J(oz1Var, null, null, new s8d((Object) envVarA, (cy7) null, (byte) 3), 3);
        }
        if (((Boolean) this.Q.getValue()).booleanValue()) {
            jo0Var = new jo0((byte) 22, (Object) a());
            j03Var2 = this.s0;
            if (j03Var2 != null) {
                Intrinsics.k("backgroundLocationTracker");
                throw null;
            }
            ugj ugjVar2 = new ugj(this, rtxVar, jo0Var, j03Var2);
            this.G = ugjVar2;
            if (xi10Var.i == null) {
                xi10Var.o();
            }
            xov xovVarH8 = ugjVar2.h(xi10Var.i);
            ja7 ja7Var219 = this.b;
            dar darVarA219 = xovVarH8.A(bthVarA);
            final Function1 gudVar3 = new gud(this, xi10Var, (byte) 1);
            final byte b518 = 15;
            fq7 fq7Var218 = new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b518;
                    Function1 function1 = gudVar3;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            };
            final Function1 kedVar29 = new ked((byte) 13);
            final byte b519 = 17;
            fv80.A(ja7Var219, (c2l) darVarA219.F(fq7Var218, new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b519;
                    Function1 function1 = kedVar29;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            }));
            if (m2fVar.m == null) {
                m2fVar.k();
            }
            xov xovVarG6 = ugjVar2.g(m2fVar.m);
            ja7 ja7Var220 = this.b;
            dar darVarA220 = xovVarG6.A(bthVarA);
            final Function1 judVar10 = new jud(this, m2fVar, (byte) 1);
            final byte b520 = 18;
            fq7 fq7Var219 = new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b520;
                    Function1 function1 = judVar10;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            };
            final Function1 kedVar210 = new ked((byte) 14);
            final byte b521 = 19;
            fv80.A(ja7Var220, (c2l) darVarA220.F(fq7Var219, new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b521;
                    Function1 function1 = kedVar210;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            }));
        }
        if (l()) {
            pvk pvkVar2 = new pvk(this, f());
            this.H = pvkVar2;
            if (m2fVar.h == null) {
                m2fVar.j();
            }
            xov xovVarG7 = pvkVar2.g(m2fVar.h);
            ja7 ja7Var221 = this.b;
            dar darVarA221 = xovVarG7.A(bthVarA);
            final Function1 judVar11 = new jud(this, m2fVar, (byte) 2);
            final byte b66 = 20;
            fq7 fq7Var220 = new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b66;
                    Function1 function1 = judVar11;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            };
            final Function1 kedVar211 = new ked((byte) 15);
            final byte b67 = 21;
            fv80.A(ja7Var221, (c2l) darVarA221.F(fq7Var220, new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b67;
                    Function1 function1 = kedVar211;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            }));
        }
        sw50VarA = sw50.Companion.a(this, a());
        if (((Boolean) this.V.getValue()).booleanValue()) {
            zw50 zw50Var2 = new zw50(this, sw50VarA);
            this.I = zw50Var2;
            xov xovVarH9 = zw50Var2.h(o9rVar);
            ja7 ja7Var32 = this.b;
            dar darVarA32 = xovVarH9.A(bthVarA);
            final Function1 iudVar12 = new iud(this, (byte) 2);
            final byte b68 = 22;
            fq7 fq7Var221 = new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b68;
                    Function1 function1 = iudVar12;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            };
            final Function1 kedVar212 = new ked((byte) 16);
            final byte b69 = 23;
            fv80.A(ja7Var32, (c2l) darVarA32.F(fq7Var221, new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b69;
                    Function1 function1 = kedVar212;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            }));
            if (m2fVar.h == null) {
                m2fVar.j();
            }
            xov xovVarG8 = zw50Var2.g(m2fVar.h);
            ja7 ja7Var33 = this.b;
            dar darVarA33 = xovVarG8.A(bthVarA);
            final Function1 judVar12 = new jud(this, m2fVar, (byte) 3);
            final byte b610 = 24;
            fq7 fq7Var31 = new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b610;
                    Function1 function1 = judVar12;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            };
            final Function1 kedVar213 = new ked((byte) 17);
            final byte b611 = 25;
            fv80.A(ja7Var33, (c2l) darVarA33.F(fq7Var31, new fq7() { // from class: hud
                @Override // defpackage.fq7
                public final void accept(Object obj) throws Exception {
                    byte b110 = b611;
                    Function1 function1 = kedVar213;
                    switch (b110) {
                        case 0:
                            int i = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        case 1:
                            int i2 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 2:
                            int i3 = EventController.O0;
                            ((eud) function1).invoke(obj);
                            break;
                        case 3:
                            int i4 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 4:
                            int i5 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 5:
                            int i6 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 6:
                            int i7 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 7:
                            int i8 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 8:
                            int i9 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 9:
                            int i10 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 10:
                            int i11 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 11:
                            int i12 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 12:
                            int i13 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 13:
                            int i14 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 14:
                            int i15 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 15:
                            int i16 = EventController.O0;
                            ((gud) function1).invoke(obj);
                            break;
                        case 16:
                            int i17 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 17:
                            int i18 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 18:
                            int i19 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 19:
                            int i20 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 20:
                            int i21 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 21:
                            int i22 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 22:
                            int i23 = EventController.O0;
                            ((iud) function1).invoke(obj);
                            break;
                        case 23:
                            int i24 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 24:
                            int i25 = EventController.O0;
                            ((jud) function1).invoke(obj);
                            break;
                        case 25:
                            int i26 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 26:
                            int i27 = EventController.O0;
                            ((cic) function1).invoke(obj);
                            break;
                        case 27:
                            int i28 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                        case 28:
                            int i29 = EventController.O0;
                            ((fud) function1).invoke(obj);
                            break;
                        default:
                            int i30 = EventController.O0;
                            ((ked) function1).invoke(obj);
                            break;
                    }
                }
            }));
        } else {
            sw50VarA.d();
        }
        b().a(c());
        xi10Var.p();
        if (j()) {
            i7lVar = this.v0;
            if (i7lVar != null) {
                Intrinsics.k("activityRecognitionController");
                throw null;
            }
            ((fu) i7lVar.get()).g(o9rVar);
        }
        jke.d(nijVar, "EventController", new imd((byte) 13));
    }

    public final boolean j() {
        return ((Boolean) this.R.getValue()).booleanValue();
    }

    public final boolean k() {
        return ((Boolean) this.T.getValue()).booleanValue();
    }

    public final boolean l() {
        return ((Boolean) this.U.getValue()).booleanValue();
    }

    public final boolean m() {
        return ((Boolean) this.K.getValue()).booleanValue();
    }

    public final boolean n() {
        return ((Boolean) this.M.getValue()).booleanValue();
    }

    public final void o(Intent intent) {
        esi esiVar;
        Integer numValueOf;
        Integer numValueOf2;
        Integer numValueOf3;
        esi esiVar2 = esi.e;
        this.g.onNext(intent);
        ((Handler) this.e.getValue()).post(new y91((byte) 7, this));
        if (j()) {
            ebp ebpVar = this.q0;
            if (ebpVar == null) {
                Intrinsics.k("modalityStatsManager");
                throw null;
            }
            ((mx40) ebpVar.d).getClass();
            long jCurrentTimeMillis = System.currentTimeMillis();
            hbp hbpVar = ebpVar.b;
            long j = hbpVar.a().getLong("MODALITY_STATS_LAST_SENT_TIME", 0L);
            long j2 = jCurrentTimeMillis - j;
            if (j2 < 0) {
                SharedPreferences.Editor editorEdit = hbpVar.a().edit();
                editorEdit.putLong("MODALITY_STATS_LAST_SENT_TIME", jCurrentTimeMillis);
                editorEdit.apply();
            } else if (j2 >= fbp.a) {
                Set set = tim.a;
                kx1 kx1Var = new kx1(j2, (byte) 17);
                CopyOnWriteArraySet copyOnWriteArraySet = oom.a;
                ajm ajmVar = new ajm(esiVar2);
                ojm ojmVar = ojm.INFO;
                oom.b(ajmVar, ojmVar, "ModalityStatsManager", kx1Var);
                hbp hbpVar2 = ebpVar.a.a;
                long j3 = hbpVar2.a().getLong("TOTAL_DWELL_UPDATE_INTERVAL_DURATION", 0L);
                int i = hbpVar2.a().getInt("NUM_DWELL_UPDATE_INTERVAL", 0);
                boolean z = j3 > 0 && i > 0;
                int i2 = hbpVar2.a().getInt("NUM_DRIVE_START", 0);
                boolean z2 = z;
                int i3 = hbpVar2.a().getInt("NUM_DRIVE_UPDATE", 0);
                int i4 = hbpVar2.a().getInt("NUM_DRIVE_END", 0);
                int i5 = hbpVar2.a().getInt("NUM_DWELL_START", 0);
                int i6 = hbpVar2.a().getInt("NUM_DWELL_UPDATE", 0);
                int i7 = hbpVar2.a().getInt("NUM_DWELL_END", 0);
                int i8 = hbpVar2.a().getInt("NUM_TRIP_START", 0);
                int i9 = hbpVar2.a().getInt("NUM_TRIP_UPDATE", 0);
                int i10 = hbpVar2.a().getInt("NUM_TRIP_END", 0);
                if (z2) {
                    bmc bmcVar = fmc.b;
                    numValueOf = Integer.valueOf((int) fmc.r(tod0.Q(j3 / ((long) i), mmc.MILLISECONDS), mmc.SECONDS));
                } else {
                    numValueOf = null;
                }
                if (z2) {
                    bmc bmcVar2 = fmc.b;
                    numValueOf2 = Integer.valueOf((int) fmc.r(tod0.Q(hbpVar2.a().getLong("MAX_DWELL_UPDATE_INTERVAL_DURATION", 0L), mmc.MILLISECONDS), mmc.SECONDS));
                } else {
                    numValueOf2 = null;
                }
                if (z2) {
                    bmc bmcVar3 = fmc.b;
                    numValueOf3 = Integer.valueOf((int) fmc.r(tod0.Q(hbpVar2.a().getLong("MIN_DWELL_UPDATE_INTERVAL_DURATION", 0L), mmc.MILLISECONDS), mmc.SECONDS));
                } else {
                    numValueOf3 = null;
                }
                v5p v5pVar = ebpVar.c;
                bmc bmcVar4 = fmc.b;
                mmc mmcVar = mmc.MILLISECONDS;
                long jQ = tod0.Q(j, mmcVar);
                mmc mmcVar2 = mmc.SECONDS;
                v5pVar.b(new gbp(Long.valueOf(fmc.r(jQ, mmcVar2)), Long.valueOf(fmc.r(tod0.Q(jCurrentTimeMillis, mmcVar), mmcVar2)), Long.valueOf(fmc.r(tod0.Q(j2, mmcVar), mmcVar2)), Long.valueOf(i2), Long.valueOf(i3), Long.valueOf(i4), Long.valueOf(i5), Long.valueOf(i6), Long.valueOf(i7), Long.valueOf(i8), Long.valueOf(i9), Long.valueOf(i10), numValueOf != 0 ? Long.valueOf(numValueOf.intValue()) : null, numValueOf2 != 0 ? Long.valueOf(numValueOf2.intValue()) : null, numValueOf3 != null ? Long.valueOf(numValueOf3.intValue()) : null));
                esiVar = esiVar2;
                oom.a(new ajm(esiVar), ojmVar, "ModalityStatsManager", null, new hxn((byte) 20));
                oom.b(new ajm(esiVar), ojmVar, "ModalityStatsManager", new kx1(jCurrentTimeMillis, (byte) 18));
                SharedPreferences.Editor editorEdit2 = hbpVar.a().edit();
                editorEdit2.clear();
                editorEdit2.apply();
                SharedPreferences.Editor editorEdit3 = hbpVar.a().edit();
                editorEdit3.putLong("MODALITY_STATS_LAST_SENT_TIME", jCurrentTimeMillis);
                editorEdit3.apply();
            }
            esiVar = esiVar2;
        } else {
            esiVar = esiVar2;
        }
        if (((Boolean) this.Y.getValue()).booleanValue()) {
            eoz eozVar = this.r0;
            if (eozVar == null) {
                Intrinsics.k("sentianceDiagnosticsManager");
                throw null;
            }
            ((mx40) eozVar.d).getClass();
            long jCurrentTimeMillis2 = System.currentTimeMillis();
            goz gozVar = eozVar.b;
            String str = "SENTIANCE_DIAGNOSTICS_LAST_SENT_TIME";
            long j4 = gozVar.c().getLong("SENTIANCE_DIAGNOSTICS_LAST_SENT_TIME", 0L);
            long j5 = jCurrentTimeMillis2 - j4;
            if (j5 < 0) {
                SharedPreferences.Editor editorEdit4 = gozVar.c().edit();
                editorEdit4.putLong("SENTIANCE_DIAGNOSTICS_LAST_SENT_TIME", jCurrentTimeMillis2);
                editorEdit4.apply();
                return;
            }
            if (j5 < foz.a()) {
                return;
            }
            Set set2 = tim.a;
            a6t a6tVar = new a6t(j5, (byte) 11);
            CopyOnWriteArraySet copyOnWriteArraySet2 = oom.a;
            String str2 = "SentianceDiagnosticsManager";
            oom.b(new ajm(esiVar), ojm.INFO, "SentianceDiagnosticsManager", a6tVar);
            JSONObject jSONObject = new JSONObject();
            jSONObject.put("diagnostics_start_time", j4);
            jSONObject.put("diagnostics_end_time", jCurrentTimeMillis2);
            bmc bmcVar5 = fmc.b;
            mmc mmcVar3 = mmc.MILLISECONDS;
            long jQ2 = tod0.Q(j5, mmcVar3);
            mmc mmcVar4 = mmc.SECONDS;
            jSONObject.put("diagnostics_total_time", (int) fmc.r(jQ2, mmcVar4));
            goz gozVar2 = eozVar.a.a;
            int i11 = gozVar2.c().getInt("NUM_LOCATION_REQUESTS", 0);
            long j6 = gozVar2.c().getLong("TOTAL_LOCATION_REQUEST_DURATION", 0L);
            long j7 = gozVar2.c().getLong("MAX_LOCATION_REQUEST_DURATION", 0L);
            esi esiVar3 = esiVar;
            long j8 = gozVar2.c().getLong("MIN_LOCATION_REQUEST_DURATION", 0L);
            jSONObject.put("num_location_requests", i11);
            jSONObject.put("total_location_request_duration", (int) fmc.r(tod0.Q(j6, mmcVar3), mmcVar4));
            if (i11 > 0) {
                jSONObject.put("avg_location_request_duration", (int) fmc.r(tod0.Q(j6 / ((long) i11), mmcVar3), mmcVar4));
                jSONObject.put("max_location_request_duration", (int) fmc.r(tod0.Q(j7, mmcVar3), mmcVar4));
                jSONObject.put("min_location_request_duration", (int) fmc.r(tod0.Q(j8, mmcVar3), mmcVar4));
            }
            SharedPreferences sharedPreferencesC = gozVar2.c();
            Set<String> set3 = bjd.a;
            Set<String> stringSet = sharedPreferencesC.getStringSet("FOREGROUND_CLASS_NAME_SET", set3);
            if (stringSet != null) {
                set3 = stringSet;
            }
            Iterator it = set3.iterator();
            long j9 = 0;
            long j10 = 0;
            long j11 = 0;
            long j12 = 0;
            while (it.hasNext()) {
                String str3 = (String) it.next();
                Iterator it2 = it;
                eoz eozVar2 = eozVar;
                String str4 = str2;
                long j13 = gozVar2.c().getLong(String.format("FOREGROUND_%s_MAX_FOREGROUND_WINDOW_DURATION", Arrays.copyOf(new Object[]{str3}, 1)), 0L);
                long j14 = j12;
                long j15 = gozVar2.c().getLong(String.format("FOREGROUND_%s_MIN_FOREGROUND_WINDOW_DURATION", Arrays.copyOf(new Object[]{str3}, 1)), 0L);
                int i12 = gozVar2.c().getInt(String.format("FOREGROUND_%s_NUM_FOREGROUND_WINDOWS", Arrays.copyOf(new Object[]{str3}, 1)), 0);
                long j16 = gozVar2.c().getLong(String.format("FOREGROUND_%s_TOTAL_FOREGROUND_WINDOW_DURATION", Arrays.copyOf(new Object[]{str3}, 1)), 0L);
                jSONObject.put(String.format("foreground_%s_num_foreground_windows", Arrays.copyOf(new Object[]{str3}, 1)), i12);
                long j17 = i12;
                long j18 = j9 + j17;
                String str5 = String.format("foreground_%s_total_foreground_window_duration", Arrays.copyOf(new Object[]{str3}, 1));
                bmc bmcVar6 = fmc.b;
                mmc mmcVar5 = mmc.MILLISECONDS;
                long j19 = j11;
                long jQ3 = tod0.Q(j16, mmcVar5);
                mmc mmcVar6 = mmc.SECONDS;
                jSONObject.put(str5, (int) fmc.r(jQ3, mmcVar6));
                j10 += j16;
                if (i12 > 0) {
                    jSONObject.put(String.format("foreground_%s_avg_foreground_window_duration", Arrays.copyOf(new Object[]{str3}, 1)), (int) fmc.r(tod0.Q(j16 / j17, mmcVar5), mmcVar6));
                    jSONObject.put(String.format("foreground_%s_max_foreground_window_duration", Arrays.copyOf(new Object[]{str3}, 1)), (int) fmc.r(tod0.Q(j13, mmcVar5), mmcVar6));
                    j11 = (j19 == 0 || j13 > j19) ? j13 : j19;
                    jSONObject.put(String.format("foreground_%s_min_foreground_window_duration", Arrays.copyOf(new Object[]{str3}, 1)), (int) fmc.r(tod0.Q(j15, mmcVar5), mmcVar6));
                    j12 = (j14 == 0 || j15 < j14) ? j15 : j14;
                } else {
                    j12 = j14;
                    j11 = j19;
                }
                it = it2;
                str2 = str4;
                eozVar = eozVar2;
                j9 = j18;
            }
            eoz eozVar3 = eozVar;
            long j20 = j11;
            String str6 = str2;
            long j21 = j12;
            jSONObject.put("num_foreground_windows", j9);
            bmc bmcVar7 = fmc.b;
            mmc mmcVar7 = mmc.MILLISECONDS;
            long jQ4 = tod0.Q(j10, mmcVar7);
            mmc mmcVar8 = mmc.SECONDS;
            jSONObject.put("total_foreground_window_duration", (int) fmc.r(jQ4, mmcVar8));
            if (j9 > 0) {
                jSONObject.put("avg_foreground_window_duration", (int) fmc.r(tod0.Q(j10 / j9, mmcVar7), mmcVar8));
                jSONObject.put("max_foreground_window_duration", (int) fmc.r(tod0.Q(j20, mmcVar7), mmcVar8));
                jSONObject.put("min_foreground_window_duration", (int) fmc.r(tod0.Q(j21, mmcVar7), mmcVar8));
            }
            SharedPreferences sharedPreferencesC2 = gozVar2.c();
            Set<String> set4 = bjd.a;
            Set<String> stringSet2 = sharedPreferencesC2.getStringSet("SERVICE_CLASS_NAME_SET", set4);
            if (stringSet2 != null) {
                set4 = stringSet2;
            }
            long j22 = 0;
            long j23 = 0;
            long j24 = 0;
            long j25 = 0;
            for (String str7 : set4) {
                long j26 = j25;
                long j27 = gozVar2.c().getLong(String.format("SERVICE_%s_MAX_SERVICE_WINDOW_DURATION", Arrays.copyOf(new Object[]{str7}, 1)), 0L);
                String str8 = str;
                long j28 = j24;
                long j29 = gozVar2.c().getLong(String.format("SERVICE_%s_MIN_SERVICE_WINDOW_DURATION", Arrays.copyOf(new Object[]{str7}, 1)), 0L);
                int i13 = gozVar2.c().getInt(String.format("SERVICE_%s_NUM_SERVICE_WINDOWS", Arrays.copyOf(new Object[]{str7}, 1)), 0);
                long j30 = j23;
                long j31 = gozVar2.c().getLong(String.format("SERVICE_%s_TOTAL_SERVICE_WINDOW_DURATION", Arrays.copyOf(new Object[]{str7}, 1)), 0L);
                jSONObject.put(String.format("service_%s_num_service_windows", Arrays.copyOf(new Object[]{str7}, 1)), i13);
                long j32 = i13;
                j22 += j32;
                String str9 = String.format("service_%s_total_service_window_duration", Arrays.copyOf(new Object[]{str7}, 1));
                bmc bmcVar8 = fmc.b;
                mmc mmcVar9 = mmc.MILLISECONDS;
                long jQ5 = tod0.Q(j31, mmcVar9);
                mmc mmcVar10 = mmc.SECONDS;
                jSONObject.put(str9, (int) fmc.r(jQ5, mmcVar10));
                long j33 = j30 + j31;
                if (i13 > 0) {
                    jSONObject.put(String.format("service_%s_avg_service_window_duration", Arrays.copyOf(new Object[]{str7}, 1)), (int) fmc.r(tod0.Q(j31 / j32, mmcVar9), mmcVar10));
                    jSONObject.put(String.format("service_%s_max_service_window_duration", Arrays.copyOf(new Object[]{str7}, 1)), (int) fmc.r(tod0.Q(j27, mmcVar9), mmcVar10));
                    if (j28 == 0 || j27 > j28) {
                        j28 = j27;
                    }
                    jSONObject.put(String.format("service_%s_min_service_window_duration", Arrays.copyOf(new Object[]{str7}, 1)), (int) fmc.r(tod0.Q(j29, mmcVar9), mmcVar10));
                    if (j26 == 0 || j29 < j26) {
                        j25 = j29;
                    }
                    j24 = j28;
                    str = str8;
                    j23 = j33;
                }
                j25 = j26;
                j24 = j28;
                str = str8;
                j23 = j33;
            }
            String str10 = str;
            long j34 = j24;
            long j35 = j25;
            jSONObject.put("num_service_windows", j22);
            bmc bmcVar9 = fmc.b;
            mmc mmcVar11 = mmc.MILLISECONDS;
            long jQ6 = tod0.Q(j23, mmcVar11);
            mmc mmcVar12 = mmc.SECONDS;
            jSONObject.put("total_service_window_duration", (int) fmc.r(jQ6, mmcVar12));
            if (j22 > 0) {
                jSONObject.put("avg_service_window_duration", (int) fmc.r(tod0.Q(j23 / j22, mmcVar11), mmcVar12));
                jSONObject.put("max_service_window_duration", (int) fmc.r(tod0.Q(j34, mmcVar11), mmcVar12));
                jSONObject.put("min_service_window_duration", (int) fmc.r(tod0.Q(j35, mmcVar11), mmcVar12));
            }
            eozVar3.c.a("sentiance-diagnostics", jSONObject);
            Set set5 = tim.a;
            doz dozVar = new doz(jSONObject, (byte) 0);
            CopyOnWriteArraySet copyOnWriteArraySet3 = oom.a;
            ajm ajmVar2 = new ajm(esiVar3);
            ojm ojmVar2 = ojm.INFO;
            oom.b(ajmVar2, ojmVar2, str6, dozVar);
            oom.b(new ajm(esiVar3), ojmVar2, str6, new a6t(jCurrentTimeMillis2, (byte) 12));
            SharedPreferences.Editor editorEdit5 = gozVar.c().edit();
            editorEdit5.clear();
            editorEdit5.apply();
            SharedPreferences.Editor editorEdit6 = gozVar.c().edit();
            editorEdit6.putLong(str10, jCurrentTimeMillis2);
            editorEdit6.apply();
        }
    }

    @Override // android.app.Service
    public final IBinder onBind(Intent intent) {
        return null;
    }

    @Override // android.app.Service
    public final void onCreate() {
        boolean z;
        byte b;
        m7r m7rVar;
        String str;
        Set set = tim.a;
        nij nijVar = nij.f;
        byte b2 = 24;
        jke.d(nijVar, "EventController", new imd(b2));
        super.onCreate();
        db9 db9Var = ((q69) tef.g(this)).a;
        this.C = (sdm) db9Var.F8.get();
        this.i0 = db9Var.e();
        this.j0 = (lw2) db9Var.Ya.get();
        this.k0 = (rz2) db9Var.Za.get();
        this.l0 = (s410) db9Var.ab.get();
        this.m0 = (l510) db9Var.cb.get();
        this.n0 = (i510) db9Var.bb.get();
        this.o0 = (arc) db9Var.gb.get();
        this.p0 = ne3.Companion.a();
        this.q0 = (ebp) db9Var.jb.get();
        this.r0 = (eoz) db9Var.lb.get();
        this.s0 = (j03) db9Var.mb.get();
        this.t0 = (GpiErrorSharedPreferences) db9Var.M4.get();
        this.u0 = (h820) db9Var.la.get();
        this.v0 = h2c.a(db9Var.rb);
        this.w0 = (avk) db9Var.k8.get();
        this.x0 = (vba) db9Var.yb.get();
        byte b3 = 25;
        char c = 0;
        byte b4 = 23;
        this.y0 = new lsz(new nym(new wuz(b3)), new vsg(db9Var.a.a, (byte) 0), new v2p(b4), new wuz(b3));
        this.z0 = new vsg(db9Var.a.a, (byte) 0);
        this.A0 = db9Var.f();
        this.B0 = (v5p) db9Var.h0.get();
        this.C0 = (vz1) db9Var.z.get();
        this.D0 = (vam) db9Var.zb.get();
        this.E0 = (lx40) db9Var.Z0.get();
        this.F0 = h2c.a(db9Var.Bb);
        this.G0 = h2c.a(db9Var.Sb);
        this.H0 = h2c.a(db9Var.Tb);
        this.I0 = h2c.a(db9Var.Wb);
        this.J0 = (wq) db9Var.Ra.get();
        this.K0 = (qi20) db9Var.Ab.get();
        this.L0 = (dhf) db9Var.O7.get();
        this.M0 = (GpiConnectionWarmer) db9Var.Xb.get();
        this.a = false;
        this.d.start();
        jke.d(nijVar, "EventController", new hs(this, (byte) 19));
        jke.d(nijVar, "EventController", new hs(this, (byte) 20));
        jke.d(nijVar, "EventController", new hs(this, (byte) 21));
        jke.d(nijVar, "EventController", new hs(this, (byte) 22));
        jke.d(nijVar, "EventController", new hs(this, b4));
        jke.d(nijVar, "EventController", new hs(this, b2));
        jke.d(nijVar, "EventController", new hs(this, b3));
        iud iudVar = new iud(this, (byte) 15);
        CopyOnWriteArraySet copyOnWriteArraySet = oom.a;
        oom.b(new ajm(nijVar), ojm.INFO, "EventController", iudVar);
        byte b5 = 26;
        jke.d(nijVar, "EventController", new hs(this, b5));
        jke.d(nijVar, "EventController", new hs(this, (byte) 16));
        jke.d(nijVar, "EventController", new hs(this, (byte) 17));
        ybv ybvVar = (ybv) this.c0.getValue();
        Context applicationContext = getApplicationContext();
        SharedPreferences sharedPreferences = ybvVar.a;
        if (sharedPreferences.getBoolean("pending_preemptive_restart", false)) {
            ArrayList arrayListL = vs6.l("memory_mb", Integer.valueOf(sharedPreferences.getInt("pending_restart_memory_mb", 0)), "threshold_mb", Integer.valueOf(sharedPreferences.getInt("pending_restart_threshold_mb", 0)));
            long j = sharedPreferences.getLong("pending_restart_seconds_since_last_kill", -1L);
            if (j >= 0) {
                arrayListL.add("seconds_since_last_kill");
                arrayListL.add(Long.valueOf(j));
            }
            ybvVar.d.invoke(applicationContext, "event-controller-preemptive-restart", arrayListL.toArray(new Object[0]));
            sharedPreferences.edit().remove("pending_preemptive_restart").remove("pending_restart_memory_mb").remove("pending_restart_threshold_mb").remove("pending_restart_seconds_since_last_kill").apply();
        }
        byte b6 = 6;
        if (((Boolean) this.Z.getValue()).booleanValue()) {
            ybv ybvVar2 = (ybv) this.c0.getValue();
            Context applicationContext2 = getApplicationContext();
            if (ybvVar2.e >= 30) {
                try {
                    ybvVar2.a(applicationContext2);
                } catch (Exception e) {
                    Set set2 = tim.a;
                    gom gomVar = new gom(e, b5);
                    CopyOnWriteArraySet copyOnWriteArraySet2 = oom.a;
                    oom.b(new ajm(nijVar), ojm.WARN, "ProcessExitObserver", gomVar);
                }
            }
            ybv ybvVar3 = (ybv) this.c0.getValue();
            if (!ybvVar3.a.edit().putLong("process_start_ms", ((Number) ybvVar3.f.invoke()).longValue()).commit()) {
                Set set3 = tim.a;
                l9v l9vVar = new l9v(b6);
                CopyOnWriteArraySet copyOnWriteArraySet3 = oom.a;
                oom.b(new ajm(nijVar), ojm.WARN, "ProcessExitObserver", l9vVar);
            }
        }
        Set set4 = tim.a;
        imd imdVar = new imd((byte) 25);
        CopyOnWriteArraySet copyOnWriteArraySet4 = oom.a;
        cy7 cy7Var = null;
        oom.a(new ajm(nijVar), ojm.INFO, "EventController", null, imdVar);
        rz2 rz2Var = this.k0;
        if (rz2Var == null) {
            Intrinsics.k("genesisEngineApi");
            throw null;
        }
        byte b7 = 3;
        if (rz2Var.b) {
            z = true;
            b = 4;
        } else {
            lw2 lw2Var = rz2Var.a;
            if (lw2Var.n.getAndSet(true)) {
                z = true;
                b = 4;
            } else {
                lw2Var.e.log("AwarenessEngine", "Initialize called, initializing AwarenessEngine this = " + lw2Var);
                b = 4;
                lw2Var.e.log("AwarenessEngine", "deviceBlade = " + lw2Var.i);
                a7p a7pVar = b7p.Companion;
                ndm.Companion.getClass();
                zpz zpzVar = ndm.a;
                a7pVar.getClass();
                di50 di50Var = di50.a;
                di50Var.a(zpzVar);
                y9c.Companion.getClass();
                di50Var.a(y9c.a);
                lw2Var.e.log("AwarenessEngine", "registerForAccessEvent");
                p710 p710Var = lw2Var.q;
                if (p710Var != null) {
                    p710Var.a(null);
                }
                lw2Var.q = pv1.J(oz1.a, null, null, new q41(lw2Var, cy7Var, (byte) 7), 3);
                ody odyVar = lw2Var.k;
                ijj ijjVar = odyVar.c;
                mw2 mw2Var = ijjVar.b;
                fmv fmvVar = ijjVar.i;
                bvk bvkVar = ijjVar.m;
                byte b8 = 5;
                DeviceConfigProvider deviceConfigProvider = ijjVar.n;
                m7r m7rVar2 = ijjVar.l;
                Context context = ijjVar.a;
                yv80 yv80Var = new yv80(m7rVar2, deviceConfigProvider, new o91(context, c), (byte) 17);
                try {
                    PackageInfo packageInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
                    String str2 = packageInfo.versionName;
                    m7rVar = m7rVar2;
                    try {
                        str = str2 + " (" + packageInfo.getLongVersionCode() + ")";
                    } catch (Exception unused) {
                        str = "";
                    }
                } catch (Exception unused2) {
                    m7rVar = m7rVar2;
                }
                tfh tfhVar = new tfh(mw2Var, fmvVar, bvkVar, deviceConfigProvider, yv80Var, str);
                Context context2 = ijjVar.a;
                mw2 mw2Var2 = ijjVar.b;
                fmv fmvVar2 = ijjVar.i;
                bvk bvkVar2 = ijjVar.m;
                DeviceConfigProvider deviceConfigProvider2 = ijjVar.n;
                GenesisFeatureAccess genesisFeatureAccess = ijjVar.c;
                kfh kfhVar = new kfh(context2, mw2Var2, fmvVar2, bvkVar2, deviceConfigProvider2, new kv80(m7rVar, deviceConfigProvider2, genesisFeatureAccess, new o91(context2, (char) 0)), genesisFeatureAccess, ijjVar.I, ijjVar.J, ijjVar.K, ijjVar.L);
                byte b9 = 2;
                Set setW = a72.W(new csr[]{tfhVar, kfhVar});
                oz1 oz1Var = oz1.a;
                bsr[] bsrVarArr = {new ere(ijjVar.e, ijjVar.g, ijjVar.h, ijjVar.d, ijjVar.o, ijjVar.m), new ftu(ijjVar.q, ijjVar.e, ijjVar.g, ijjVar.m, ijjVar.d, ijjVar.o, ijjVar.c), new w24(ijjVar.r, ijjVar.e, ijjVar.g, ijjVar.m, ijjVar.d, ijjVar.o, ijjVar.c, ijjVar.l, ijjVar.I), new u410(ijjVar.u, ijjVar.e, ijjVar.m), new m510(ijjVar.u, ijjVar.e, ijjVar.g, ijjVar.m, ijjVar.J), ijjVar.y};
                LinkedHashSet linkedHashSet = new LinkedHashSet();
                int i = 0;
                for (int i2 = 6; i < i2; i2 = 6) {
                    bsr bsrVar = bsrVarArr[i];
                    if (bsrVar != null) {
                        linkedHashSet.add(bsrVar);
                    }
                    i++;
                }
                asr asrVar = new asr(ijjVar.a, ijjVar.e, ijjVar.f, ijjVar.m, setW, linkedHashSet, ijjVar.w, ijjVar.J);
                Context context3 = ijjVar.a;
                fmv fmvVar3 = ijjVar.f;
                fmv fmvVar4 = ijjVar.h;
                fmv fmvVar5 = ijjVar.i;
                bvk bvkVar3 = ijjVar.m;
                m7r m7rVar3 = ijjVar.l;
                DeviceConfigProvider deviceConfigProvider3 = ijjVar.n;
                bre breVar = new bre(context3, fmvVar3, fmvVar4, fmvVar5, bvkVar3, m7rVar3, deviceConfigProvider3);
                fmv fmvVar6 = ijjVar.j;
                fmv fmvVar7 = ijjVar.k;
                GenesisFeatureAccess genesisFeatureAccess2 = ijjVar.c;
                yoc yocVar = new yoc(context3, fmvVar3, fmvVar6, fmvVar7, m7rVar3, fmvVar5, deviceConfigProvider3, bvkVar3, genesisFeatureAccess2, ijjVar.o);
                bre breVar2 = new bre(context3, fmvVar3, ijjVar.f3188p, ijjVar.q, bvkVar3, genesisFeatureAccess2, m7rVar3);
                o24 o24Var = new o24(context3, fmvVar3, fmvVar6, ijjVar.r, bvkVar3, genesisFeatureAccess2, ijjVar.x.a(), ijjVar.I);
                Context context4 = ijjVar.a;
                fmv fmvVar8 = ijjVar.f;
                Iterator it = ((ArrayList) a72.v(new i73[]{asrVar, breVar, yocVar, breVar2, o24Var, new cwa(context4, fmvVar8, ijjVar.f3188p, ijjVar.s, ijjVar.t, ijjVar.c, ijjVar.m, ijjVar.o), new ke80(context4, fmvVar8, ijjVar.z, ijjVar.A, ijjVar.B, ijjVar.C, ijjVar.F, ijjVar.G, ijjVar.r, ijjVar.D, ijjVar.E, ijjVar.k, ijjVar.H)})).iterator();
                while (it.hasNext()) {
                    odyVar.e.add((i73) it.next());
                }
                odyVar.e.addAll(wid.a);
                for (i73 i73Var : odyVar.e) {
                    String strA = i73Var.a();
                    if (strA != null) {
                        i73Var.d = new x5h(odyVar.a, strA);
                    }
                }
                Iterator it2 = odyVar.e.iterator();
                while (it2.hasNext()) {
                    ((i73) it2.next()).c();
                }
                odyVar.d.log("RuleSystem", "registerForSystemRequest");
                oz1 oz1Var2 = oz1.a;
                cy7 cy7Var2 = null;
                odyVar.f = pv1.J(oz1Var2, null, null, new ndy(odyVar, cy7Var2, (byte) 6), 3);
                pv1.J(oz1Var2, null, null, new ndy(odyVar, cy7Var2, b9), 3);
                pv1.J(oz1Var2, null, null, new ndy(odyVar, cy7Var2, b7), 3);
                pv1.J(oz1Var2, null, null, new ndy(odyVar, cy7Var2, (byte) 0), 3);
                z = true;
                pv1.J(oz1Var2, null, null, new ndy(odyVar, cy7Var2, z ? (byte) 1 : (byte) 0), 3);
                pv1.J(oz1Var2, null, null, new ndy(odyVar, cy7Var2, b8), 3);
            }
            rz2Var.b = z;
        }
        lw2 lw2VarB = b();
        s410 s410Var = this.l0;
        if (s410Var == null) {
            Intrinsics.k("srtDeviceRule");
            throw null;
        }
        lw2VarB.a(s410Var);
        lw2 lw2VarB2 = b();
        if (!lw2VarB2.o.getAndSet(z)) {
            ody odyVar2 = lw2VarB2.k;
            odyVar2.getClass();
            pv1.J(oz1.a, null, null, new ndy(odyVar2, null, b), 3);
        }
        lw2 lw2VarB3 = b();
        l510 l510Var = this.m0;
        if (l510Var == null) {
            Intrinsics.k("srtMemberRule");
            throw null;
        }
        lw2VarB3.a(l510Var);
        lw2 lw2VarB4 = b();
        if (!lw2VarB4.f4316p.getAndSet(true)) {
            ody odyVar3 = lw2VarB4.k;
            odyVar3.getClass();
            pv1.J(oz1.a, null, null, new ndy(odyVar3, null, (byte) 5), 3);
        }
        if (j()) {
            lw2 lw2VarB5 = b();
            i7l i7lVar = this.H0;
            if (i7lVar == null) {
                Intrinsics.k("tripGenerationRule");
                throw null;
            }
            lw2VarB5.a((i73) i7lVar.get());
            lw2 lw2VarB6 = b();
            i7l i7lVar2 = this.G0;
            if (i7lVar2 == null) {
                Intrinsics.k("eventSessionRule");
                throw null;
            }
            lw2VarB6.a((i73) i7lVar2.get());
        }
        if (cb1.c) {
            try {
                i7l i7lVar3 = this.F0;
                if (i7lVar3 == null) {
                    Intrinsics.k("sensorRecordingManager");
                    throw null;
                }
                ((b) i7lVar3.get()).m();
            } catch (Exception e2) {
                Set set5 = tim.a;
                zv2 zv2Var = new zv2(e2, (byte) 6);
                CopyOnWriteArraySet copyOnWriteArraySet5 = oom.a;
                oom.b(new ajm(nijVar), ojm.WARN, "EventController", zv2Var);
            }
        }
        if (((Boolean) this.W.getValue()).booleanValue()) {
            if (!j()) {
                Set set6 = tim.a;
                imd imdVar2 = new imd((byte) 26);
                CopyOnWriteArraySet copyOnWriteArraySet6 = oom.a;
                oom.a(new ajm(nijVar), ojm.WARN, "EventController", null, imdVar2);
            }
            lw2 lw2VarB7 = b();
            i7l i7lVar4 = this.I0;
            if (i7lVar4 == null) {
                Intrinsics.k("watchOverMeRule");
                throw null;
            }
            lw2VarB7.a((i73) i7lVar4.get());
        }
    }

    @Override // android.app.Service
    public final void onDestroy() {
        Set set = tim.a;
        nij nijVar = nij.f;
        oud oudVar = new oud((byte) 15);
        CopyOnWriteArraySet copyOnWriteArraySet = oom.a;
        cy7 cy7Var = null;
        oom.a(new ajm(nijVar), ojm.INFO, "EventController", null, oudVar);
        this.d.quitSafely();
        d dVar = this.N0;
        byte b = 1;
        byte b2 = 2;
        if (dVar == null) {
            tim.d("EventController", null, new e41(b2), 2);
        } else {
            try {
                unregisterReceiver(dVar);
            } catch (IllegalArgumentException e) {
                Set set2 = tim.a;
                tim.d("EventController", null, new ao(e, b), 2);
            }
        }
        this.b.b();
        xi10 xi10Var = this.j;
        if (xi10Var != null) {
            xi10Var.c();
        }
        gry gryVar = this.k;
        if (gryVar != null) {
            gryVar.c();
        }
        rtx rtxVar = this.i;
        if (rtxVar != null) {
            rtxVar.c();
        }
        tcm tcmVar = this.q;
        if (tcmVar != null) {
            tcmVar.c();
        }
        asg asgVar = this.r;
        if (asgVar != null) {
            asgVar.c();
        }
        m2f m2fVar = this.l;
        if (m2fVar != null) {
            m2fVar.c();
        }
        yr50 yr50Var = this.m;
        if (yr50Var != null) {
            yr50Var.c();
        }
        kr50 kr50Var = this.n;
        if (kr50Var != null) {
            kr50Var.c();
        }
        wdm wdmVar = this.f1006p;
        if (wdmVar != null) {
            wdmVar.c();
        }
        z6m z6mVar = this.z;
        if (z6mVar != null) {
            z6mVar.c();
        }
        om60 om60Var = this.s;
        if (om60Var != null) {
            om60Var.c();
        }
        q03 q03Var = this.t;
        byte b3 = 0;
        if (q03Var != null) {
            c2l c2lVar = (c2l) q03Var.b;
            if (c2lVar != null) {
                rvb.a(c2lVar);
            }
            ((ja7) q03Var.c).f();
            ((AtomicBoolean) q03Var.i).set(false);
        }
        uu uuVar = this.u;
        if (uuVar != null) {
            o0k o0kVar = uuVar.d;
            if (o0kVar != null) {
                o0kVar.a(null);
            }
            if (tlb0.G(uuVar.a)) {
                pv1.J(uuVar.c, null, null, new iu(uuVar, cy7Var, b), 3);
            }
        }
        kv9 kv9Var = this.v;
        if (kv9Var != null) {
            kv9Var.l();
        }
        j9a0 j9a0Var = this.w;
        if (j9a0Var != null) {
            j9a0Var.u();
        }
        ud7 ud7Var = this.x;
        if (ud7Var != null) {
            c2l c2lVar2 = (c2l) ud7Var.d;
            if (c2lVar2 != null) {
                rvb.a(c2lVar2);
            }
            c2l c2lVar3 = (c2l) ud7Var.c;
            if (c2lVar3 != null) {
                rvb.a(c2lVar3);
            }
        }
        izh izhVar = this.y;
        if (izhVar != null) {
            c2l c2lVar4 = izhVar.c;
            if (c2lVar4 != null) {
                rvb.a(c2lVar4);
            }
            tlb0.G(izhVar.b);
        }
        n090 n090Var = this.A;
        if (n090Var != null) {
            n090Var.c();
        }
        lgh lghVar = this.B;
        if (lghVar != null) {
            rgh.Companion.a(this);
            lghVar.c();
        }
        lw2 lw2VarB = b();
        lw2VarB.e.log("AwarenessEngine", "onDestroy this = " + lw2VarB);
        x5b0 x5b0Var = lw2VarB.r;
        synchronized (x5b0Var) {
            try {
                Iterator it = ((ArrayList) x5b0Var.a).iterator();
                while (it.hasNext()) {
                    ((o0k) it.next()).a(null);
                }
                ((ArrayList) x5b0Var.a).clear();
            } catch (Throwable th) {
                throw th;
            }
        }
        ody odyVar = lw2VarB.k;
        p710 p710Var = odyVar.f;
        if (p710Var != null) {
            p710Var.a(null);
        }
        Iterator it2 = odyVar.e.iterator();
        while (it2.hasNext()) {
            ((i73) it2.next()).b();
        }
        hj70 hj70Var = this.D;
        if (hj70Var != null) {
            hj70Var.c();
        }
        fgf fgfVar = this.J;
        if (fgfVar != null) {
            fgfVar.c();
        }
        y7u y7uVar = this.E;
        if (y7uVar != null) {
            y7uVar.c();
        }
        umv umvVar = this.F;
        if (umvVar != null) {
            umvVar.c();
        }
        ugj ugjVar = this.G;
        if (ugjVar != null) {
            ugjVar.c();
        }
        yhh yhhVar = this.o;
        if (yhhVar != null) {
            yhhVar.c();
        }
        if (j()) {
            i7l i7lVar = this.v0;
            if (i7lVar == null) {
                Intrinsics.k("activityRecognitionController");
                throw null;
            }
            fu fuVar = (fu) i7lVar.get();
            nx7 nx7Var = fuVar.g;
            hha hhaVar = q38.a;
            n900.i(nx7Var.getCoroutineContext());
            o0k o0kVar2 = fuVar.n;
            if (o0kVar2 != null) {
                o0kVar2.a(null);
            }
            fuVar.m = null;
        }
        if (cb1.c) {
            try {
                i7l i7lVar2 = this.F0;
                if (i7lVar2 == null) {
                    Intrinsics.k("sensorRecordingManager");
                    throw null;
                }
                ((b) i7lVar2.get()).r();
            } catch (Exception e2) {
                Set set3 = tim.a;
                nij nijVar2 = nij.f;
                qud qudVar = new qud(e2, b3);
                CopyOnWriteArraySet copyOnWriteArraySet2 = oom.a;
                oom.b(new ajm(nijVar2), ojm.WARN, "EventController", qudVar);
            }
        }
        pvk pvkVar = this.H;
        if (pvkVar != null) {
            pvkVar.c();
        }
        zw50 zw50Var = this.I;
        if (zw50Var != null) {
            zw50Var.c();
        }
        super.onDestroy();
    }

    @Override // android.app.Service
    public final int onStartCommand(Intent intent, int i, int i2) {
        boolean z;
        String action;
        nij nijVar = nij.f;
        String action2 = intent != null ? intent.getAction() : null;
        if (action2 == null) {
            action2 = "";
        }
        Set set = tim.a;
        dka dkaVar = new dka(action2, (byte) 6);
        CopyOnWriteArraySet copyOnWriteArraySet = oom.a;
        oom.a(new ajm(nijVar), ojm.INFO, "EventController", null, dkaVar);
        if (intent == null) {
            tim.b("EventController", null, new imd((byte) 19), 2);
            IllegalStateException illegalStateException = new IllegalStateException("Intent can't be null");
            w98 w98Var = z98.a;
            if (w98Var != null) {
                w98Var.b(illegalStateException);
            }
            stopSelf();
            return 2;
        }
        byte b = 1;
        try {
            z = intent.hasExtra("startingForeground") && intent.getBooleanExtra("startingForeground", false);
        } catch (Exception e) {
            w98 w98Var2 = z98.a;
            if (w98Var2 != null) {
                w98Var2.b(e);
            }
        }
        if (z) {
            Set set2 = tim.a;
            imd imdVar = new imd((byte) 20);
            CopyOnWriteArraySet copyOnWriteArraySet2 = oom.a;
            oom.a(new ajm(nijVar), ojm.INFO, "EventController", null, imdVar);
            if (!((u3g) this.c.getValue()).b("EventController")) {
                stopSelf();
                return 2;
            }
        }
        boolean z2 = a().a() || dsd.UNAUTHENTICATED.a(this, intent);
        if (!this.a && z2) {
            PushTraceExtras pushTraceExtras = (PushTraceExtras) pz1.r(intent, "PushTrace", PushTraceExtras.class);
            this.e0.set(pushTraceExtras != null ? pushTraceExtras.isColdLaunch() : true);
            try {
                Set set3 = tim.a;
                imd imdVar2 = new imd((byte) 21);
                CopyOnWriteArraySet copyOnWriteArraySet3 = oom.a;
                oom.a(new ajm(nijVar), ojm.INFO, "EventController", null, imdVar2);
                i();
                this.a = true;
            } catch (Throwable th) {
                this.a = true;
                throw th;
            }
        }
        if (z) {
            ja7 ja7Var = this.b;
            dar darVarA = u7r.L(6L, TimeUnit.SECONDS, iyy.a).A(rf1.a(this.d.getLooper()));
            c2l c2lVar = new c2l(new nud(new iud(this, (byte) 13), (byte) 14), new nud(new mud((byte) 12), (byte) 15), yid0.d);
            darVarA.a(c2lVar);
            ja7Var.c(c2lVar);
        }
        if (z2) {
            Set set4 = tim.a;
            uh1 uh1Var = new uh1(intent, (byte) 4);
            CopyOnWriteArraySet copyOnWriteArraySet4 = oom.a;
            oom.a(new ajm(nijVar), ojm.INFO, "EventController", null, uh1Var);
            if (((Boolean) tef.v(GateFlag.SrtHttpPrewarmEnabled.INSTANCE, null, null, 7)).booleanValue() && (action = intent.getAction()) != null && c.l(action, ".SharedIntents.ACTION_SMART_REAL_TIME_PUSH", false)) {
                GpiConnectionWarmer gpiConnectionWarmer = this.M0;
                if (gpiConnectionWarmer == null) {
                    Intrinsics.k("gpiConnectionWarmer");
                    throw null;
                }
                gpiConnectionWarmer.warmGpi1Connection();
            }
            if (intent.getAction() != null) {
                o(intent);
            }
        } else {
            Set set5 = tim.a;
            tim.b("EventController", null, new imd((byte) 23), 2);
            GpiErrorSharedPreferences gpiErrorSharedPreferences = this.t0;
            if (gpiErrorSharedPreferences == null) {
                Intrinsics.k("gpiErrorSharedPreferences");
                throw null;
            }
            gpiErrorSharedPreferences.reset();
            Context applicationContext = getApplicationContext();
            PendingIntent pendingIntentG = tcm.g(536870912, applicationContext);
            if (pendingIntentG == null) {
                i4m i4mVar = new i4m((byte) 24);
                CopyOnWriteArraySet copyOnWriteArraySet5 = oom.a;
                oom.a(new ajm(nijVar), ojm.INFO, "tcm", null, i4mVar);
            } else {
                if (GoogleApiAvailability.e.b(applicationContext, a.a) == 0) {
                    LocationServices.getFusedLocationProviderClient(applicationContext.getApplicationContext()).removeLocationUpdates(pendingIntentG);
                }
                pendingIntentG.cancel();
                i4m i4mVar2 = new i4m((byte) 26);
                CopyOnWriteArraySet copyOnWriteArraySet6 = oom.a;
                oom.a(new ajm(nijVar), ojm.INFO, "tcm", null, i4mVar2);
            }
            if (z) {
                new Handler(Looper.getMainLooper()).post(new rud(this, b));
            } else {
                stopSelf();
            }
        }
        return 2;
    }

    public final o9r q() {
        xov xovVar = new xov();
        this.g = xovVar;
        o9r o9rVar = new o9r(xovVar.A(rf1.a(this.d.getLooper())), new nud(new iud(this, (byte) 14), (byte) 16), (byte) 3);
        this.h = o9rVar;
        return o9rVar;
    }

    public final void r(m2f m2fVar, String str, String str2) {
        p("filteredLocation", str, str2);
        o9r o9rVarJ = m2fVar.j();
        om60 om60Var = this.s;
        if (om60Var != null) {
            om60Var.f = o9rVarJ;
            if (om60Var.h) {
                om60Var.f();
            }
        }
        rtx rtxVar = this.i;
        if (rtxVar != null) {
            rtxVar.r(o9rVarJ);
        }
        umv umvVar = this.F;
        if (umvVar != null) {
            umvVar.k(o9rVarJ);
        }
        pvk pvkVar = this.H;
        if (pvkVar != null) {
            pvkVar.g(o9rVarJ);
        }
        zw50 zw50Var = this.I;
        if (zw50Var != null) {
            zw50Var.g(o9rVarJ);
        }
    }

    public final void s(String str, String str2) {
        y7u y7uVar;
        p("intent", str, str2);
        o9r o9rVarQ = q();
        tcm tcmVar = this.q;
        if (tcmVar != null) {
            tcmVar.o(o9rVarQ);
        }
        xi10 xi10Var = this.j;
        if (xi10Var != null) {
            xi10Var.r(o9rVarQ);
        }
        rtx rtxVar = this.i;
        if (rtxVar != null) {
            rtxVar.s(o9rVarQ);
        }
        asg asgVar = this.r;
        if (asgVar != null) {
            asgVar.p(o9rVarQ);
        }
        om60 om60Var = this.s;
        if (om60Var != null) {
            om60Var.g(o9rVarQ);
        }
        q03 q03Var = this.t;
        if (q03Var != null) {
            q03Var.r(o9rVarQ);
        }
        uu uuVar = this.u;
        if (uuVar != null) {
            uuVar.e(o9rVarQ);
        }
        umv umvVar = this.F;
        if (umvVar != null) {
            umvVar.l(o9rVarQ);
        }
        if (k()) {
            ud7 ud7Var = this.x;
            if (ud7Var != null) {
                ud7Var.l(o9rVarQ);
            }
            izh izhVar = this.y;
            if (izhVar != null) {
                izhVar.b(o9rVarQ);
            }
        } else {
            kv9 kv9Var = this.v;
            if (kv9Var != null) {
                kv9Var.k(o9rVarQ);
            }
            j9a0 j9a0Var = this.w;
            if (j9a0Var != null) {
                j9a0Var.s(o9rVarQ);
            }
        }
        if (m()) {
            rgh.Companion.a(this);
            lgh lghVar = this.B;
            if (lghVar != null) {
                lghVar.k(o9rVarQ);
            }
        }
        if ((((Boolean) this.N.getValue()).booleanValue() || ((Boolean) this.O.getValue()).booleanValue()) && (y7uVar = this.E) != null) {
            y7uVar.h(o9rVarQ);
        }
        zw50 zw50Var = this.I;
        if (zw50Var != null) {
            zw50Var.h(o9rVarQ);
        }
        if (j()) {
            i7l i7lVar = this.v0;
            if (i7lVar == null) {
                Intrinsics.k("activityRecognitionController");
                throw null;
            }
            fu fuVar = (fu) i7lVar.get();
            fuVar.m = o9rVarQ;
            fuVar.h();
        }
    }

    public final void t(tcm tcmVar, String str, String str2) {
        p("locationSample", str, str2);
        o9r o9rVarN = tcmVar.n();
        m2f m2fVar = this.l;
        if (m2fVar != null) {
            m2fVar.m(o9rVarN);
        }
        rtx rtxVar = this.i;
        if (rtxVar != null) {
            rtxVar.t(o9rVarN);
        }
        fgf fgfVar = this.J;
        if (fgfVar != null) {
            fgfVar.k(o9rVarN);
        }
    }

    public final void u(kr50 kr50Var, wdm wdmVar, String str, String str2) {
        xi10 xi10Var;
        kv9 kv9Var;
        z6m z6mVar;
        p("sendResult", str, str2);
        u7r u7rVarI = kr50Var.i();
        ArrayList arrayList = new ArrayList();
        arrayList.add(u7rVarI);
        yhh yhhVar = this.o;
        if (yhhVar != null) {
            arrayList.add(yhhVar.g());
        }
        u7r u7rVarH = wdmVar.h();
        wdmVar.i(arrayList);
        xi10 xi10Var2 = this.j;
        if (xi10Var2 != null) {
            xi10Var2.q((o9r) u7rVarH);
        }
        asg asgVar = this.r;
        if (asgVar != null) {
            asgVar.r((o9r) u7rVarH);
        }
        if (n() && (z6mVar = this.z) != null) {
            z6mVar.i((o9r) u7rVarH);
        }
        rtx rtxVar = this.i;
        if (rtxVar != null) {
            rtxVar.u((o9r) u7rVarH);
        }
        if (!k() && (kv9Var = this.v) != null) {
            kv9Var.c((o9r) u7rVarH);
        }
        n090 n090Var = this.A;
        if (n090Var != null) {
            n090Var.g((o9r) u7rVarH);
        }
        hj70 hj70Var = this.D;
        if (hj70Var != null) {
            hj70Var.f((o9r) u7rVarH);
        }
        fgf fgfVar = this.J;
        if (fgfVar != null) {
            fgfVar.l((o9r) u7rVarH);
        }
        if (((Boolean) this.X.getValue()).booleanValue() && (xi10Var = this.j) != null) {
            y(xi10Var.i());
        }
        xi10 xi10Var3 = this.j;
        if (xi10Var3 != null) {
            z(xi10Var3, wdmVar);
        }
    }

    public final void v(m2f m2fVar, String str, String str2) {
        p("sendableLocation", str, str2);
        o9r o9rVarK = m2fVar.k();
        if (m()) {
            rgh.Companion.a(this);
            lgh lghVar = this.B;
            if (lghVar != null) {
                lghVar.l(o9rVarK);
            }
        }
        ugj ugjVar = this.G;
        if (ugjVar != null) {
            ugjVar.g(o9rVarK);
        }
        yr50 yr50Var = this.m;
        if (yr50Var != null) {
            yr50Var.h(o9rVarK);
        }
    }

    public final void w(xi10 xi10Var, String str, String str2) {
        p("runningStrategy", str, str2);
        o9r o9rVarO = xi10Var.o();
        gry gryVar = this.k;
        if (gryVar != null) {
            gryVar.g(o9rVarO);
        }
        if (k()) {
            ud7 ud7Var = this.x;
            if (ud7Var != null) {
                ud7Var.m(o9rVarO);
            }
        } else {
            j9a0 j9a0Var = this.w;
            if (j9a0Var != null) {
                j9a0Var.t(o9rVarO);
            }
        }
        ugj ugjVar = this.G;
        if (ugjVar != null) {
            ugjVar.h(o9rVarO);
        }
        wdm wdmVar = this.f1006p;
        if (wdmVar != null) {
            z(xi10Var, wdmVar);
        }
    }

    public final void x(cwu cwuVar) {
        ArrayList arrayListL = vs6.l("memory_mb", Integer.valueOf(cwuVar.a()), "threshold_mb", Integer.valueOf(cwuVar.e()), "should_restart", Boolean.valueOf(cwuVar.c()));
        String strD = cwuVar.d();
        if (strD != null) {
            arrayListL.add("skip_reason");
            arrayListL.add(strD);
        }
        if (cwuVar.b() >= 0) {
            arrayListL.add("seconds_since_last_kill");
            arrayListL.add(Long.valueOf(cwuVar.b()));
        }
        Context applicationContext = getApplicationContext();
        Object[] array = arrayListL.toArray(new Object[0]);
        dej.e(applicationContext, "event-controller-preemptive-restart-eval", Arrays.copyOf(array, array.length));
    }

    public final void y(u7r u7rVar) {
        c2l c2lVar = this.f0;
        ja7 ja7Var = this.b;
        if (c2lVar != null) {
            ja7Var.d(c2lVar);
        }
        byte b = 25;
        zcd zcdVar = new zcd(b, new ucd((byte) 24));
        u7rVar.getClass();
        dar darVarA = new b9r(u7rVar, zcdVar, (byte) 1).A(rf1.a(this.d.getLooper()));
        c2l c2lVar2 = new c2l(new zcd((byte) 26, new f8d((byte) 9, this)), new zcd((byte) 27, new ucd(b)), yid0.d);
        darVarA.a(c2lVar2);
        this.f0 = c2lVar2;
        ja7Var.c(c2lVar2);
    }

    public final void z(xi10 xi10Var, wdm wdmVar) {
        sdm sdmVar = this.C;
        if (sdmVar == null) {
            Intrinsics.k("locationSendPriorityManager");
            throw null;
        }
        if (sdmVar.a) {
            c2l c2lVar = this.g0;
            ja7 ja7Var = this.b;
            if (c2lVar != null) {
                ja7Var.d(c2lVar);
            }
            c2l c2lVar2 = this.h0;
            if (c2lVar2 != null) {
                ja7Var.d(c2lVar2);
            }
            if (xi10Var.i == null) {
                xi10Var.o();
            }
            o9r o9rVar = xi10Var.i;
            HandlerThread handlerThread = this.d;
            dar darVarA = o9rVar.A(rf1.a(handlerThread.getLooper()));
            byte b = 11;
            byte b2 = 10;
            nud nudVar = new nud(new iud(this, b), b2);
            nud nudVar2 = new nud(new mud(b2), b);
            tvw tvwVar = yid0.d;
            c2l c2lVar3 = new c2l(nudVar, nudVar2, tvwVar);
            darVarA.a(c2lVar3);
            this.g0 = c2lVar3;
            ja7Var.c(c2lVar3);
            dar darVarA2 = wdmVar.f().A(rf1.a(handlerThread.getLooper()));
            byte b3 = 12;
            c2l c2lVar4 = new c2l(new nud(new iud(this, b3), b3), new nud(new mud(b), (byte) 13), tvwVar);
            darVarA2.a(c2lVar4);
            this.h0 = c2lVar4;
            ja7Var.c(c2lVar4);
        }
    }
}
