// ignore: library_prefixes
import 'dart:io';

import 'package:dio/dio.dart';

// ignore: library_prefixes
import 'package:dio/dio.dart' as CallAdapterType;
import 'package:apppro/api/core/api_core.dart';
import 'package:apppro/api/core/parse_error_logger.dart';
import 'package:apppro/api/token/fcm_token.dart';
import 'package:apppro/feature/profile/domain/entities/company_location.dart';
import 'package:apppro/feature/profile/domain/entities/invitation.dart';
import 'package:apppro/feature/profile/domain/entities/keterangan.dart';
import 'package:retrofit/dio.dart';
import 'package:retrofit/http.dart';

part 'profile_api.g.dart';

@RestApi()
abstract class ProfileApi with $Profile {
  factory ProfileApi(
      CallAdapterType.Dio dio, {
        String baseUrl,
        ParseErrorLogger errorLogger,
      }) = _ProfileApi;
}

mixin $Profile {
  @GET('api/company/list')
  Future<HttpResponse<dynamic>> getCompanyStaffList();

  // --- ADDED: Endpoint untuk mengambil ID Karyawan ---
  @GET('api/absensi/HomeA')
  Future<HttpResponse<dynamic>> getStaffListWithIds({
    @Query("idperusahaan") required String idPerusahaan,
    @Query("tglstart") required String tglStart,
    @Query("tglend") required String tglEnd,
  });
  // ----------------------------------------------------

  @POST('api/company/verify-employee')
  Future<HttpResponse<dynamic>> verifyEmployee({
    @Body() required Map<String, dynamic> body,
  });

  @POST('api/company/update-role')
  Future<HttpResponse<dynamic>> updateRole({
    @Body() required Map<String, dynamic> body,
  });

  @POST('api/company/fire-employee')
  Future<HttpResponse<dynamic>> fireEmployee({
    @Body() required Map<String, dynamic> body,
  });

  @GET('api/company/public-link')
  Future<HttpResponse<dynamic>> getPublicInviteLink();

  @POST('api/company/send-invite')
  Future<HttpResponse<dynamic>> sendInviteByEmail({
    @Body() required Map<String, dynamic> body,
  });

  @PUT('api/profile/company-profile')
  Future<HttpResponse<dynamic>> updateCompanyProfile({
    @Body() required Map<String, dynamic> body,
  });

  @POST('api/profile/company-logo')
  @MultiPart()
  Future<HttpResponse<dynamic>> updateCompanyLogo({
    @Part(name: 'file', contentType: "image/*") required File file,
    @Part(name: 'desc') String? desc,
    @CancelRequest() CancelToken? cancelToken,
  });

  @POST('api/profile/upload-avatar')
  @MultiPart()
  Future<HttpResponse<dynamic>> updateUserPhoto({
    @Part(name: 'file', contentType: "image/*") required File file,
    @Part(name: 'desc') String? desc,
    @CancelRequest() CancelToken? cancelToken,
  });

  @PUT('api/profile/user-profile')
  Future<HttpResponse<dynamic>> updateUserProfile({
    @Body() required Map<String, dynamic> body,
  });

  @GET('api/profile/user-profile')
  Future<HttpResponse<dynamic>> getUserProfileByToken();

  @GET('api/profile/company-profile')
  Future<HttpResponse<dynamic>> getCompanyProfileByToken();

  @GET('api/profile/viewprofile')
  Future<HttpResponse<dynamic>> getProfile({
    @Query("email") required String email,
  });

  @PUT('api/profile/update')
  Future<HttpResponse<dynamic>> updateProfile({
    @Query("email") required String email,
    @Part(name: 'IDKaryawan') required String idKaryawan,
    @Part(name: 'NamaKaryawan') required String namaKaryawan,
    @Part(name: 'IDPerusahaan') required String idPerusahaan,
    @Part(name: 'NamaPerusahaan') required String namaPerusahaan,
    @Part(name: 'AlamatLoc') required String? alamat,
    @Part(name: 'Gender') String? gender,
    @Part(name: 'AlamatEmail') required String alamatEmail,
    @Part(name: "FotoKaryawan", contentType: "image/*") required File? foto,
    @Header("Content-Type") String contentType = "multipart/form-data",
    @CancelRequest() CancelToken? cancelToken,
  });

  @DELETE('api/profile/account')
  Future<HttpResponse<dynamic>> deleteAccount({
    @Query("email") required String email,
    @CancelRequest() CancelToken? cancelToken,
  });

  // --- NEW: Endpoint untuk Hapus Perusahaan ---
  @DELETE('api/company/delete-company')
  Future<HttpResponse<dynamic>> deleteCompany({
    @Body() required Map<String, dynamic> body,
    @CancelRequest() CancelToken? cancelToken,
  });
  // --------------------------------------------

  // --- NEW: Endpoint log-activity ---
  @POST('api/company/log-activity')
  Future<HttpResponse<dynamic>> postLogActivity({
    @Header("Authorization") required String token,
    @Body() required Map<String, dynamic> body,
    @CancelRequest() CancelToken? cancelToken,
  });
  // ----------------------------------

  @PUT('/api/Location/SaveToken')
  Future<HttpResponse<dynamic>> saveFCMToken({
    @Query('KaryawanID') required String idKaryawan,
    @Body() required FcmToken fcmToken,
    @Header("Content-Type") String contentType = "application/json",
  });

  @GET('api/profile/home-company')
  Future<HttpResponse<dynamic>> getCompany({
    @Query("email") required String email,
  });

  @GET('api/profile/search-company')
  Future<HttpResponse<dynamic>> companyKaryawanList({
    @Query("idperusahaan") required String idPerusahaan,
  });

  @PUT('api/profile/like')
  Future<HttpResponse<dynamic>> companyLike({
    @Query("karyawanid") required String karyawanId,
    @Query("perusahaanid") required String perusahaanId,
  });

  @PUT('api/profile/delete')
  Future<HttpResponse<dynamic>> stopWorking({
    @Query("email") required String email,
  });

  @POST('api/invite')
  Future<HttpResponse<String>> companyInviteStaff({
    @Body() required Invitation request,
    @CancelRequest() CancelToken? cancelToken,
  });

  @PUT('api/profile/edit')
  Future<HttpResponse<dynamic>> companyUpdateKeterangan({
    @Query("idPer") required String idPerusahan,
    @Body() required Keterangan body,
    @CancelRequest() CancelToken? cancelToken,
  });

  @PUT('api/profile/editloc')
  Future<HttpResponse<dynamic>> companyUpdateLocation({
    @Query("idPer") required String idPerusahan,
    @Body() required CompanyLocation body,
    @CancelRequest() CancelToken? cancelToken,
  });

  @GET('api/arsip/statlaporan')
  Future<HttpResponse<dynamic>> getArchiveStatLaporan({
    @Query("idperusahaan") required String idPerusahan,
    @Query("tglstart") required String tglstart,
    @Query("tglend") required String tglend,
    @Query("emailrep") required String emailrep,
    @CancelRequest() CancelToken? cancelToken,
  });

  @GET('api/arsip/statkehadiran')
  Future<HttpResponse<dynamic>> getArchiveStatKehadiran({
    @Query("idperusahaan") required String idPerusahan,
    @Query("tglstart") required String tglstart,
    @Query("tglend") required String tglend,
    @Query("emailrep") required String emailrep,
    @CancelRequest() CancelToken? cancelToken,
  });

  // --- Endpoint Arsip Reimburse ---
  @GET('api/arsip/statreimburse')
  Future<HttpResponse<dynamic>> getArchiveStatReimburse({
    @Query("idperusahaan") required String idPerusahan,
    @Query("tglstart") required String tglstart,
    @Query("tglend") required String tglend,
    @Query("emailrep") required String emailrep,
    @CancelRequest() CancelToken? cancelToken,
  });

  // --- NEW: Endpoint Arsip Tugas ---
  @GET('api/arsip/stattugas')
  Future<HttpResponse<dynamic>> getArchiveStatTugas({
    @Query("idperusahaan") required String idPerusahan,
    @Query("tglstart") required String tglstart,
    @Query("tglend") required String tglend,
    @Query("emailrep") required String emailrep,
    @CancelRequest() CancelToken? cancelToken,
  });
  // -------------------------------------

  @PUT('api/Profile/edit')
  Future<HttpResponse<dynamic>> editCompany({
    @Query("idper") required String idPerusahaan,
    @Part(name: 'NamaPerusahaan') required String namaPerusahaan,
    @Part(name: 'Keterangan') required String keterangan,
    @Part(name: 'AlamatLatitude') required String alamatLatitude,
    @Part(name: 'AlamatLoc') required String alamatLoc,
    @Part(name: 'AlamatLongtitude') required String alamatLongtitude,
    @Part(name: 'noTelp') required int noTelp,
    @Part(name: 'noWA') required int noWA,
    @Part(name: "Foto", contentType: "image/*") File? foto,
    @Header("Content-Type") String contentType = "multipart/form-data",
    @CancelRequest() CancelToken? cancelToken,
  });

  @GET('api/berkas/total-size')
  Future<HttpResponse<dynamic>> getTotalFileSize({
    @Query("category") String category = "ALL",
    @CancelRequest() CancelToken? cancelToken,
  });
}