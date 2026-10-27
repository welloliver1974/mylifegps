package com.life360.android.l360networkkit.apis;

import com.life360.android.l360networkkit.apis.request.GetPlacesOfInterestRequest;
import com.life360.android.l360networkkit.apis.responses.GetPlacesOfInterestResponse;
import defpackage.ayh;
import defpackage.cy7;
import defpackage.hs3;
import defpackage.lyh;
import defpackage.nwr;
import defpackage.suw;
import kotlin.Metadata;

/* JADX INFO: loaded from: classes.dex */
@Metadata(d1 = {"\u0000 \n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0003\bf\u0018\u00002\u00020\u0001J*\u0010\b\u001a\b\u0012\u0004\u0012\u00020\u00070\u00062\b\b\u0001\u0010\u0003\u001a\u00020\u00022\b\b\u0001\u0010\u0005\u001a\u00020\u0004H§@¢\u0006\u0004\b\b\u0010\t¨\u0006\nÀ\u0006\u0003"}, d2 = {"Lcom/life360/android/l360networkkit/apis/PlacesNetworkApi;", "", "", "circleId", "Lcom/life360/android/l360networkkit/apis/request/GetPlacesOfInterestRequest;", "getPlacesOfInterestRequest", "Lsuw;", "Lcom/life360/android/l360networkkit/apis/responses/GetPlacesOfInterestResponse;", "getPlacesOfInterest", "(Ljava/lang/String;Lcom/life360/android/l360networkkit/apis/request/GetPlacesOfInterestRequest;Lcy7;)Ljava/lang/Object;", "networkkit-l360"}, k = 1, mv = {2, 4, 0}, xi = 48)
public interface PlacesNetworkApi {
    @nwr("/v5/dwells")
    @lyh({"ce-type: com.life360.dwells.v1"})
    Object getPlacesOfInterest(@ayh("circleid") String str, @hs3 GetPlacesOfInterestRequest getPlacesOfInterestRequest, cy7<? super suw<GetPlacesOfInterestResponse>> cy7Var);
}
