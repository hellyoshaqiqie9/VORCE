// ignore: library_prefixes
import 'dart:io';

import 'package:dio/dio.dart';
// ignore: library_prefixes
import 'package:dio/dio.dart' as CallAdapterType;
import 'package:apppro/api/core/parse_error_logger.dart';
import 'package:retrofit/dio.dart';
import 'package:retrofit/http.dart';

part 'dashboard_api.g.dart';

@RestApi()
abstract class DashboardApi with $Dashboard {
  factory DashboardApi(CallAdapterType.Dio dio, {String baseUrl, ParseErrorLogger errorLogger}) = _DashboardApi;
}

mixin $Dashboard {
  // --- UPDATED: Menambahkan param idperusahaan & idkaryawan ---
  @GET('api/absensi/indie')
  Future<HttpResponse<dynamic>> getAttendance({
    @Query("idperusahaan") required String idperusahaan,
    @Query("idkaryawan") required String idkaryawan,
    @Query("tglstart") required String start,
    @Query("tglend") required String end,
  });

  @GET('api/absensi/HomeA')
  Future<HttpResponse<dynamic>> getAttendanceList({
    @Query("idperusahaan") required String idperusahaan,
    @Query("tglstart") required String start,
    @Query("tglend") required String end,
  });

  // --- Endpoint Upload Berkas ---
  // UPDATED: Menambahkan param category (optional)
  @POST('api/berkas/upload')
  @MultiPart()
  Future<HttpResponse<dynamic>> uploadFile({
    @Header("Authorization") required String token,
    @Part(name: "file", contentType: "image/*") required File file,
    @Query("category") String? category,
  });

  // --- Endpoint CheckIn (JSON Body) ---
  @POST('api/absensi')
  Future<HttpResponse<dynamic>> checkIn({
    @Body() required Map<String, dynamic> body,
    @CancelRequest() CancelToken? cancelToken,
  });

  // --- Endpoint CheckOut (UPDATED: JSON Body + ID Foto) ---
  @PUT('api/absensi/pulang')
  Future<HttpResponse<dynamic>> checkOut({
    @Query('id') required String id,
    @Query('tanggal') required String date,
    @Body() required Map<String, dynamic> body,
    @CancelRequest() CancelToken? cancelToken,
  });

  @PUT('api/absensi/istirahatIn')
  Future<HttpResponse<dynamic>> restIn({
    @Query('id') required String id,
    @Part(name: 'NamaKaryawan') required String staffName,
    @Part(name: 'alamatistirahatin') required String address,
    @Part(name: 'latistirahatin') required String latitude,
    @Part(name: 'longistirahatin') required String longitude,
    @Part(name: "Foto", contentType: "image/*") required File photo,
    @CancelRequest() CancelToken? cancelToken,
  });

  @PUT('api/absensi/istirahatOut')
  Future<HttpResponse<dynamic>> restOut({
    @Query('id') required String id,
    @Part(name: 'NamaKaryawan') required String staffName,
    @Part(name: 'alamatistirahatout') required String address,
    @Part(name: 'latistirahatout') required String latitude,
    @Part(name: 'longistirahatout') required String longitude,
    @Part(name: "Foto", contentType: "image/*") required File photo,
    @CancelRequest() CancelToken? cancelToken,
  });

  @GET('https://api-y4ntpb3uvq-et.a.run.app/api/company/log-activity')
  Future<HttpResponse<dynamic>> getActivityFeed({
    @Header("Authorization") required String token,
  });

  @GET('api/company/list')
  Future<HttpResponse<dynamic>> getCompanyList({
    @Header("Authorization") required String token,
  });

  // --- ADDED: Reimburse List ---
  @GET('api/reimburse/list')
  Future<HttpResponse<dynamic>> getReimburseList({
    @Header("Authorization") required String token,
  });

  @GET('api/Promosi/TayangPromosi')
  Future<HttpResponse<dynamic>> getBannerHome();

  @PUT('api/Absensi/ApproveAbsen')
  Future<HttpResponse<dynamic>> approveAbsence({
    @Query('id') required String id,
    @Part(name: 'NamaKaryawan') required String namaKaryawan,
    @Part(name: 'IDKaryawan') required String idKaryawan,
    @Part(name: 'Status') required String status,
  });
}