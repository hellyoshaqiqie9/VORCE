// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'absence.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Absence {

// PERUBAHAN PENTING: ID sekarang String dan menggunakan converter aman
@JsonKey(fromJson: _stringFromAny) String? get id; String? get idKaryawan; String? get namaKaryawan;@FirestoreDateTimeConverter() DateTime? get tanggal;@FirestoreDateTimeConverter() DateTime? get waktuCheckIn;@FirestoreDateTimeConverter() DateTime? get waktuCheckOut; String? get bluetoothID; String? get alamatLongtitude; String? get alamatLatitude; String? get alamatLoc; dynamic get telat; String? get foto; String? get fotoKaryawan; String? get idPerusahaan; String? get namaperusahaan;@FirestoreDateTimeConverter() DateTime? get tanggalAbsensi; String? get fotoPulang; String? get latitudePulang; String? get longtitudePulang; String? get durasi; String? get alamatPulang; String? get fotoIsitrahatIn; String? get fotoIstirahatOut;@FirestoreDateTimeConverter() DateTime? get istirahatIn;@FirestoreDateTimeConverter() DateTime? get istirahatOut; String? get latistirahatin; String? get longistirahatin; String? get alamatistirahatin; String? get latistirahatout; String? get longistirahatout; String? get alamatistirahatout; String? get status;// --- FIELD BARU ---
 String? get shift;// --- TAMBAHAN UNTUK FILTERING (INJEKSI DARI FIRESTORE) ---
 String? get email; String? get alamatEmail;
/// Create a copy of Absence
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$AbsenceCopyWith<Absence> get copyWith => _$AbsenceCopyWithImpl<Absence>(this as Absence, _$identity);

  /// Serializes this Absence to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Absence&&(identical(other.id, id) || other.id == id)&&(identical(other.idKaryawan, idKaryawan) || other.idKaryawan == idKaryawan)&&(identical(other.namaKaryawan, namaKaryawan) || other.namaKaryawan == namaKaryawan)&&(identical(other.tanggal, tanggal) || other.tanggal == tanggal)&&(identical(other.waktuCheckIn, waktuCheckIn) || other.waktuCheckIn == waktuCheckIn)&&(identical(other.waktuCheckOut, waktuCheckOut) || other.waktuCheckOut == waktuCheckOut)&&(identical(other.bluetoothID, bluetoothID) || other.bluetoothID == bluetoothID)&&(identical(other.alamatLongtitude, alamatLongtitude) || other.alamatLongtitude == alamatLongtitude)&&(identical(other.alamatLatitude, alamatLatitude) || other.alamatLatitude == alamatLatitude)&&(identical(other.alamatLoc, alamatLoc) || other.alamatLoc == alamatLoc)&&const DeepCollectionEquality().equals(other.telat, telat)&&(identical(other.foto, foto) || other.foto == foto)&&(identical(other.fotoKaryawan, fotoKaryawan) || other.fotoKaryawan == fotoKaryawan)&&(identical(other.idPerusahaan, idPerusahaan) || other.idPerusahaan == idPerusahaan)&&(identical(other.namaperusahaan, namaperusahaan) || other.namaperusahaan == namaperusahaan)&&(identical(other.tanggalAbsensi, tanggalAbsensi) || other.tanggalAbsensi == tanggalAbsensi)&&(identical(other.fotoPulang, fotoPulang) || other.fotoPulang == fotoPulang)&&(identical(other.latitudePulang, latitudePulang) || other.latitudePulang == latitudePulang)&&(identical(other.longtitudePulang, longtitudePulang) || other.longtitudePulang == longtitudePulang)&&(identical(other.durasi, durasi) || other.durasi == durasi)&&(identical(other.alamatPulang, alamatPulang) || other.alamatPulang == alamatPulang)&&(identical(other.fotoIsitrahatIn, fotoIsitrahatIn) || other.fotoIsitrahatIn == fotoIsitrahatIn)&&(identical(other.fotoIstirahatOut, fotoIstirahatOut) || other.fotoIstirahatOut == fotoIstirahatOut)&&(identical(other.istirahatIn, istirahatIn) || other.istirahatIn == istirahatIn)&&(identical(other.istirahatOut, istirahatOut) || other.istirahatOut == istirahatOut)&&(identical(other.latistirahatin, latistirahatin) || other.latistirahatin == latistirahatin)&&(identical(other.longistirahatin, longistirahatin) || other.longistirahatin == longistirahatin)&&(identical(other.alamatistirahatin, alamatistirahatin) || other.alamatistirahatin == alamatistirahatin)&&(identical(other.latistirahatout, latistirahatout) || other.latistirahatout == latistirahatout)&&(identical(other.longistirahatout, longistirahatout) || other.longistirahatout == longistirahatout)&&(identical(other.alamatistirahatout, alamatistirahatout) || other.alamatistirahatout == alamatistirahatout)&&(identical(other.status, status) || other.status == status)&&(identical(other.shift, shift) || other.shift == shift)&&(identical(other.email, email) || other.email == email)&&(identical(other.alamatEmail, alamatEmail) || other.alamatEmail == alamatEmail));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,idKaryawan,namaKaryawan,tanggal,waktuCheckIn,waktuCheckOut,bluetoothID,alamatLongtitude,alamatLatitude,alamatLoc,const DeepCollectionEquality().hash(telat),foto,fotoKaryawan,idPerusahaan,namaperusahaan,tanggalAbsensi,fotoPulang,latitudePulang,longtitudePulang,durasi,alamatPulang,fotoIsitrahatIn,fotoIstirahatOut,istirahatIn,istirahatOut,latistirahatin,longistirahatin,alamatistirahatin,latistirahatout,longistirahatout,alamatistirahatout,status,shift,email,alamatEmail]);

@override
String toString() {
  return 'Absence(id: $id, idKaryawan: $idKaryawan, namaKaryawan: $namaKaryawan, tanggal: $tanggal, waktuCheckIn: $waktuCheckIn, waktuCheckOut: $waktuCheckOut, bluetoothID: $bluetoothID, alamatLongtitude: $alamatLongtitude, alamatLatitude: $alamatLatitude, alamatLoc: $alamatLoc, telat: $telat, foto: $foto, fotoKaryawan: $fotoKaryawan, idPerusahaan: $idPerusahaan, namaperusahaan: $namaperusahaan, tanggalAbsensi: $tanggalAbsensi, fotoPulang: $fotoPulang, latitudePulang: $latitudePulang, longtitudePulang: $longtitudePulang, durasi: $durasi, alamatPulang: $alamatPulang, fotoIsitrahatIn: $fotoIsitrahatIn, fotoIstirahatOut: $fotoIstirahatOut, istirahatIn: $istirahatIn, istirahatOut: $istirahatOut, latistirahatin: $latistirahatin, longistirahatin: $longistirahatin, alamatistirahatin: $alamatistirahatin, latistirahatout: $latistirahatout, longistirahatout: $longistirahatout, alamatistirahatout: $alamatistirahatout, status: $status, shift: $shift, email: $email, alamatEmail: $alamatEmail)';
}


}

/// @nodoc
abstract mixin class $AbsenceCopyWith<$Res>  {
  factory $AbsenceCopyWith(Absence value, $Res Function(Absence) _then) = _$AbsenceCopyWithImpl;
@useResult
$Res call({
@JsonKey(fromJson: _stringFromAny) String? id, String? idKaryawan, String? namaKaryawan,@FirestoreDateTimeConverter() DateTime? tanggal,@FirestoreDateTimeConverter() DateTime? waktuCheckIn,@FirestoreDateTimeConverter() DateTime? waktuCheckOut, String? bluetoothID, String? alamatLongtitude, String? alamatLatitude, String? alamatLoc, dynamic telat, String? foto, String? fotoKaryawan, String? idPerusahaan, String? namaperusahaan,@FirestoreDateTimeConverter() DateTime? tanggalAbsensi, String? fotoPulang, String? latitudePulang, String? longtitudePulang, String? durasi, String? alamatPulang, String? fotoIsitrahatIn, String? fotoIstirahatOut,@FirestoreDateTimeConverter() DateTime? istirahatIn,@FirestoreDateTimeConverter() DateTime? istirahatOut, String? latistirahatin, String? longistirahatin, String? alamatistirahatin, String? latistirahatout, String? longistirahatout, String? alamatistirahatout, String? status, String? shift, String? email, String? alamatEmail
});




}
/// @nodoc
class _$AbsenceCopyWithImpl<$Res>
    implements $AbsenceCopyWith<$Res> {
  _$AbsenceCopyWithImpl(this._self, this._then);

  final Absence _self;
  final $Res Function(Absence) _then;

/// Create a copy of Absence
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = freezed,Object? idKaryawan = freezed,Object? namaKaryawan = freezed,Object? tanggal = freezed,Object? waktuCheckIn = freezed,Object? waktuCheckOut = freezed,Object? bluetoothID = freezed,Object? alamatLongtitude = freezed,Object? alamatLatitude = freezed,Object? alamatLoc = freezed,Object? telat = freezed,Object? foto = freezed,Object? fotoKaryawan = freezed,Object? idPerusahaan = freezed,Object? namaperusahaan = freezed,Object? tanggalAbsensi = freezed,Object? fotoPulang = freezed,Object? latitudePulang = freezed,Object? longtitudePulang = freezed,Object? durasi = freezed,Object? alamatPulang = freezed,Object? fotoIsitrahatIn = freezed,Object? fotoIstirahatOut = freezed,Object? istirahatIn = freezed,Object? istirahatOut = freezed,Object? latistirahatin = freezed,Object? longistirahatin = freezed,Object? alamatistirahatin = freezed,Object? latistirahatout = freezed,Object? longistirahatout = freezed,Object? alamatistirahatout = freezed,Object? status = freezed,Object? shift = freezed,Object? email = freezed,Object? alamatEmail = freezed,}) {
  return _then(_self.copyWith(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,idKaryawan: freezed == idKaryawan ? _self.idKaryawan : idKaryawan // ignore: cast_nullable_to_non_nullable
as String?,namaKaryawan: freezed == namaKaryawan ? _self.namaKaryawan : namaKaryawan // ignore: cast_nullable_to_non_nullable
as String?,tanggal: freezed == tanggal ? _self.tanggal : tanggal // ignore: cast_nullable_to_non_nullable
as DateTime?,waktuCheckIn: freezed == waktuCheckIn ? _self.waktuCheckIn : waktuCheckIn // ignore: cast_nullable_to_non_nullable
as DateTime?,waktuCheckOut: freezed == waktuCheckOut ? _self.waktuCheckOut : waktuCheckOut // ignore: cast_nullable_to_non_nullable
as DateTime?,bluetoothID: freezed == bluetoothID ? _self.bluetoothID : bluetoothID // ignore: cast_nullable_to_non_nullable
as String?,alamatLongtitude: freezed == alamatLongtitude ? _self.alamatLongtitude : alamatLongtitude // ignore: cast_nullable_to_non_nullable
as String?,alamatLatitude: freezed == alamatLatitude ? _self.alamatLatitude : alamatLatitude // ignore: cast_nullable_to_non_nullable
as String?,alamatLoc: freezed == alamatLoc ? _self.alamatLoc : alamatLoc // ignore: cast_nullable_to_non_nullable
as String?,telat: freezed == telat ? _self.telat : telat // ignore: cast_nullable_to_non_nullable
as dynamic,foto: freezed == foto ? _self.foto : foto // ignore: cast_nullable_to_non_nullable
as String?,fotoKaryawan: freezed == fotoKaryawan ? _self.fotoKaryawan : fotoKaryawan // ignore: cast_nullable_to_non_nullable
as String?,idPerusahaan: freezed == idPerusahaan ? _self.idPerusahaan : idPerusahaan // ignore: cast_nullable_to_non_nullable
as String?,namaperusahaan: freezed == namaperusahaan ? _self.namaperusahaan : namaperusahaan // ignore: cast_nullable_to_non_nullable
as String?,tanggalAbsensi: freezed == tanggalAbsensi ? _self.tanggalAbsensi : tanggalAbsensi // ignore: cast_nullable_to_non_nullable
as DateTime?,fotoPulang: freezed == fotoPulang ? _self.fotoPulang : fotoPulang // ignore: cast_nullable_to_non_nullable
as String?,latitudePulang: freezed == latitudePulang ? _self.latitudePulang : latitudePulang // ignore: cast_nullable_to_non_nullable
as String?,longtitudePulang: freezed == longtitudePulang ? _self.longtitudePulang : longtitudePulang // ignore: cast_nullable_to_non_nullable
as String?,durasi: freezed == durasi ? _self.durasi : durasi // ignore: cast_nullable_to_non_nullable
as String?,alamatPulang: freezed == alamatPulang ? _self.alamatPulang : alamatPulang // ignore: cast_nullable_to_non_nullable
as String?,fotoIsitrahatIn: freezed == fotoIsitrahatIn ? _self.fotoIsitrahatIn : fotoIsitrahatIn // ignore: cast_nullable_to_non_nullable
as String?,fotoIstirahatOut: freezed == fotoIstirahatOut ? _self.fotoIstirahatOut : fotoIstirahatOut // ignore: cast_nullable_to_non_nullable
as String?,istirahatIn: freezed == istirahatIn ? _self.istirahatIn : istirahatIn // ignore: cast_nullable_to_non_nullable
as DateTime?,istirahatOut: freezed == istirahatOut ? _self.istirahatOut : istirahatOut // ignore: cast_nullable_to_non_nullable
as DateTime?,latistirahatin: freezed == latistirahatin ? _self.latistirahatin : latistirahatin // ignore: cast_nullable_to_non_nullable
as String?,longistirahatin: freezed == longistirahatin ? _self.longistirahatin : longistirahatin // ignore: cast_nullable_to_non_nullable
as String?,alamatistirahatin: freezed == alamatistirahatin ? _self.alamatistirahatin : alamatistirahatin // ignore: cast_nullable_to_non_nullable
as String?,latistirahatout: freezed == latistirahatout ? _self.latistirahatout : latistirahatout // ignore: cast_nullable_to_non_nullable
as String?,longistirahatout: freezed == longistirahatout ? _self.longistirahatout : longistirahatout // ignore: cast_nullable_to_non_nullable
as String?,alamatistirahatout: freezed == alamatistirahatout ? _self.alamatistirahatout : alamatistirahatout // ignore: cast_nullable_to_non_nullable
as String?,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,shift: freezed == shift ? _self.shift : shift // ignore: cast_nullable_to_non_nullable
as String?,email: freezed == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String?,alamatEmail: freezed == alamatEmail ? _self.alamatEmail : alamatEmail // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [Absence].
extension AbsencePatterns on Absence {
/// A variant of `map` that fallback to returning `orElse`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Absence value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Absence() when $default != null:
return $default(_that);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// Callbacks receives the raw object, upcasted.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case final Subclass2 value:
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Absence value)  $default,){
final _that = this;
switch (_that) {
case _Absence():
return $default(_that);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `map` that fallback to returning `null`.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case final Subclass value:
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Absence value)?  $default,){
final _that = this;
switch (_that) {
case _Absence() when $default != null:
return $default(_that);case _:
  return null;

}
}
/// A variant of `when` that fallback to an `orElse` callback.
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return orElse();
/// }
/// ```

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@JsonKey(fromJson: _stringFromAny)  String? id,  String? idKaryawan,  String? namaKaryawan, @FirestoreDateTimeConverter()  DateTime? tanggal, @FirestoreDateTimeConverter()  DateTime? waktuCheckIn, @FirestoreDateTimeConverter()  DateTime? waktuCheckOut,  String? bluetoothID,  String? alamatLongtitude,  String? alamatLatitude,  String? alamatLoc,  dynamic telat,  String? foto,  String? fotoKaryawan,  String? idPerusahaan,  String? namaperusahaan, @FirestoreDateTimeConverter()  DateTime? tanggalAbsensi,  String? fotoPulang,  String? latitudePulang,  String? longtitudePulang,  String? durasi,  String? alamatPulang,  String? fotoIsitrahatIn,  String? fotoIstirahatOut, @FirestoreDateTimeConverter()  DateTime? istirahatIn, @FirestoreDateTimeConverter()  DateTime? istirahatOut,  String? latistirahatin,  String? longistirahatin,  String? alamatistirahatin,  String? latistirahatout,  String? longistirahatout,  String? alamatistirahatout,  String? status,  String? shift,  String? email,  String? alamatEmail)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Absence() when $default != null:
return $default(_that.id,_that.idKaryawan,_that.namaKaryawan,_that.tanggal,_that.waktuCheckIn,_that.waktuCheckOut,_that.bluetoothID,_that.alamatLongtitude,_that.alamatLatitude,_that.alamatLoc,_that.telat,_that.foto,_that.fotoKaryawan,_that.idPerusahaan,_that.namaperusahaan,_that.tanggalAbsensi,_that.fotoPulang,_that.latitudePulang,_that.longtitudePulang,_that.durasi,_that.alamatPulang,_that.fotoIsitrahatIn,_that.fotoIstirahatOut,_that.istirahatIn,_that.istirahatOut,_that.latistirahatin,_that.longistirahatin,_that.alamatistirahatin,_that.latistirahatout,_that.longistirahatout,_that.alamatistirahatout,_that.status,_that.shift,_that.email,_that.alamatEmail);case _:
  return orElse();

}
}
/// A `switch`-like method, using callbacks.
///
/// As opposed to `map`, this offers destructuring.
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case Subclass2(:final field2):
///     return ...;
/// }
/// ```

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@JsonKey(fromJson: _stringFromAny)  String? id,  String? idKaryawan,  String? namaKaryawan, @FirestoreDateTimeConverter()  DateTime? tanggal, @FirestoreDateTimeConverter()  DateTime? waktuCheckIn, @FirestoreDateTimeConverter()  DateTime? waktuCheckOut,  String? bluetoothID,  String? alamatLongtitude,  String? alamatLatitude,  String? alamatLoc,  dynamic telat,  String? foto,  String? fotoKaryawan,  String? idPerusahaan,  String? namaperusahaan, @FirestoreDateTimeConverter()  DateTime? tanggalAbsensi,  String? fotoPulang,  String? latitudePulang,  String? longtitudePulang,  String? durasi,  String? alamatPulang,  String? fotoIsitrahatIn,  String? fotoIstirahatOut, @FirestoreDateTimeConverter()  DateTime? istirahatIn, @FirestoreDateTimeConverter()  DateTime? istirahatOut,  String? latistirahatin,  String? longistirahatin,  String? alamatistirahatin,  String? latistirahatout,  String? longistirahatout,  String? alamatistirahatout,  String? status,  String? shift,  String? email,  String? alamatEmail)  $default,) {final _that = this;
switch (_that) {
case _Absence():
return $default(_that.id,_that.idKaryawan,_that.namaKaryawan,_that.tanggal,_that.waktuCheckIn,_that.waktuCheckOut,_that.bluetoothID,_that.alamatLongtitude,_that.alamatLatitude,_that.alamatLoc,_that.telat,_that.foto,_that.fotoKaryawan,_that.idPerusahaan,_that.namaperusahaan,_that.tanggalAbsensi,_that.fotoPulang,_that.latitudePulang,_that.longtitudePulang,_that.durasi,_that.alamatPulang,_that.fotoIsitrahatIn,_that.fotoIstirahatOut,_that.istirahatIn,_that.istirahatOut,_that.latistirahatin,_that.longistirahatin,_that.alamatistirahatin,_that.latistirahatout,_that.longistirahatout,_that.alamatistirahatout,_that.status,_that.shift,_that.email,_that.alamatEmail);case _:
  throw StateError('Unexpected subclass');

}
}
/// A variant of `when` that fallback to returning `null`
///
/// It is equivalent to doing:
/// ```dart
/// switch (sealedClass) {
///   case Subclass(:final field):
///     return ...;
///   case _:
///     return null;
/// }
/// ```

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@JsonKey(fromJson: _stringFromAny)  String? id,  String? idKaryawan,  String? namaKaryawan, @FirestoreDateTimeConverter()  DateTime? tanggal, @FirestoreDateTimeConverter()  DateTime? waktuCheckIn, @FirestoreDateTimeConverter()  DateTime? waktuCheckOut,  String? bluetoothID,  String? alamatLongtitude,  String? alamatLatitude,  String? alamatLoc,  dynamic telat,  String? foto,  String? fotoKaryawan,  String? idPerusahaan,  String? namaperusahaan, @FirestoreDateTimeConverter()  DateTime? tanggalAbsensi,  String? fotoPulang,  String? latitudePulang,  String? longtitudePulang,  String? durasi,  String? alamatPulang,  String? fotoIsitrahatIn,  String? fotoIstirahatOut, @FirestoreDateTimeConverter()  DateTime? istirahatIn, @FirestoreDateTimeConverter()  DateTime? istirahatOut,  String? latistirahatin,  String? longistirahatin,  String? alamatistirahatin,  String? latistirahatout,  String? longistirahatout,  String? alamatistirahatout,  String? status,  String? shift,  String? email,  String? alamatEmail)?  $default,) {final _that = this;
switch (_that) {
case _Absence() when $default != null:
return $default(_that.id,_that.idKaryawan,_that.namaKaryawan,_that.tanggal,_that.waktuCheckIn,_that.waktuCheckOut,_that.bluetoothID,_that.alamatLongtitude,_that.alamatLatitude,_that.alamatLoc,_that.telat,_that.foto,_that.fotoKaryawan,_that.idPerusahaan,_that.namaperusahaan,_that.tanggalAbsensi,_that.fotoPulang,_that.latitudePulang,_that.longtitudePulang,_that.durasi,_that.alamatPulang,_that.fotoIsitrahatIn,_that.fotoIstirahatOut,_that.istirahatIn,_that.istirahatOut,_that.latistirahatin,_that.longistirahatin,_that.alamatistirahatin,_that.latistirahatout,_that.longistirahatout,_that.alamatistirahatout,_that.status,_that.shift,_that.email,_that.alamatEmail);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Absence extends Absence {
  const _Absence({@JsonKey(fromJson: _stringFromAny) this.id, this.idKaryawan, this.namaKaryawan, @FirestoreDateTimeConverter() this.tanggal, @FirestoreDateTimeConverter() this.waktuCheckIn, @FirestoreDateTimeConverter() this.waktuCheckOut, this.bluetoothID, this.alamatLongtitude, this.alamatLatitude, this.alamatLoc, this.telat, this.foto, this.fotoKaryawan, this.idPerusahaan, this.namaperusahaan, @FirestoreDateTimeConverter() this.tanggalAbsensi, this.fotoPulang, this.latitudePulang, this.longtitudePulang, this.durasi, this.alamatPulang, this.fotoIsitrahatIn, this.fotoIstirahatOut, @FirestoreDateTimeConverter() this.istirahatIn, @FirestoreDateTimeConverter() this.istirahatOut, this.latistirahatin, this.longistirahatin, this.alamatistirahatin, this.latistirahatout, this.longistirahatout, this.alamatistirahatout, this.status, this.shift, this.email, this.alamatEmail}): super._();
  factory _Absence.fromJson(Map<String, dynamic> json) => _$AbsenceFromJson(json);

// PERUBAHAN PENTING: ID sekarang String dan menggunakan converter aman
@override@JsonKey(fromJson: _stringFromAny) final  String? id;
@override final  String? idKaryawan;
@override final  String? namaKaryawan;
@override@FirestoreDateTimeConverter() final  DateTime? tanggal;
@override@FirestoreDateTimeConverter() final  DateTime? waktuCheckIn;
@override@FirestoreDateTimeConverter() final  DateTime? waktuCheckOut;
@override final  String? bluetoothID;
@override final  String? alamatLongtitude;
@override final  String? alamatLatitude;
@override final  String? alamatLoc;
@override final  dynamic telat;
@override final  String? foto;
@override final  String? fotoKaryawan;
@override final  String? idPerusahaan;
@override final  String? namaperusahaan;
@override@FirestoreDateTimeConverter() final  DateTime? tanggalAbsensi;
@override final  String? fotoPulang;
@override final  String? latitudePulang;
@override final  String? longtitudePulang;
@override final  String? durasi;
@override final  String? alamatPulang;
@override final  String? fotoIsitrahatIn;
@override final  String? fotoIstirahatOut;
@override@FirestoreDateTimeConverter() final  DateTime? istirahatIn;
@override@FirestoreDateTimeConverter() final  DateTime? istirahatOut;
@override final  String? latistirahatin;
@override final  String? longistirahatin;
@override final  String? alamatistirahatin;
@override final  String? latistirahatout;
@override final  String? longistirahatout;
@override final  String? alamatistirahatout;
@override final  String? status;
// --- FIELD BARU ---
@override final  String? shift;
// --- TAMBAHAN UNTUK FILTERING (INJEKSI DARI FIRESTORE) ---
@override final  String? email;
@override final  String? alamatEmail;

/// Create a copy of Absence
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$AbsenceCopyWith<_Absence> get copyWith => __$AbsenceCopyWithImpl<_Absence>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$AbsenceToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Absence&&(identical(other.id, id) || other.id == id)&&(identical(other.idKaryawan, idKaryawan) || other.idKaryawan == idKaryawan)&&(identical(other.namaKaryawan, namaKaryawan) || other.namaKaryawan == namaKaryawan)&&(identical(other.tanggal, tanggal) || other.tanggal == tanggal)&&(identical(other.waktuCheckIn, waktuCheckIn) || other.waktuCheckIn == waktuCheckIn)&&(identical(other.waktuCheckOut, waktuCheckOut) || other.waktuCheckOut == waktuCheckOut)&&(identical(other.bluetoothID, bluetoothID) || other.bluetoothID == bluetoothID)&&(identical(other.alamatLongtitude, alamatLongtitude) || other.alamatLongtitude == alamatLongtitude)&&(identical(other.alamatLatitude, alamatLatitude) || other.alamatLatitude == alamatLatitude)&&(identical(other.alamatLoc, alamatLoc) || other.alamatLoc == alamatLoc)&&const DeepCollectionEquality().equals(other.telat, telat)&&(identical(other.foto, foto) || other.foto == foto)&&(identical(other.fotoKaryawan, fotoKaryawan) || other.fotoKaryawan == fotoKaryawan)&&(identical(other.idPerusahaan, idPerusahaan) || other.idPerusahaan == idPerusahaan)&&(identical(other.namaperusahaan, namaperusahaan) || other.namaperusahaan == namaperusahaan)&&(identical(other.tanggalAbsensi, tanggalAbsensi) || other.tanggalAbsensi == tanggalAbsensi)&&(identical(other.fotoPulang, fotoPulang) || other.fotoPulang == fotoPulang)&&(identical(other.latitudePulang, latitudePulang) || other.latitudePulang == latitudePulang)&&(identical(other.longtitudePulang, longtitudePulang) || other.longtitudePulang == longtitudePulang)&&(identical(other.durasi, durasi) || other.durasi == durasi)&&(identical(other.alamatPulang, alamatPulang) || other.alamatPulang == alamatPulang)&&(identical(other.fotoIsitrahatIn, fotoIsitrahatIn) || other.fotoIsitrahatIn == fotoIsitrahatIn)&&(identical(other.fotoIstirahatOut, fotoIstirahatOut) || other.fotoIstirahatOut == fotoIstirahatOut)&&(identical(other.istirahatIn, istirahatIn) || other.istirahatIn == istirahatIn)&&(identical(other.istirahatOut, istirahatOut) || other.istirahatOut == istirahatOut)&&(identical(other.latistirahatin, latistirahatin) || other.latistirahatin == latistirahatin)&&(identical(other.longistirahatin, longistirahatin) || other.longistirahatin == longistirahatin)&&(identical(other.alamatistirahatin, alamatistirahatin) || other.alamatistirahatin == alamatistirahatin)&&(identical(other.latistirahatout, latistirahatout) || other.latistirahatout == latistirahatout)&&(identical(other.longistirahatout, longistirahatout) || other.longistirahatout == longistirahatout)&&(identical(other.alamatistirahatout, alamatistirahatout) || other.alamatistirahatout == alamatistirahatout)&&(identical(other.status, status) || other.status == status)&&(identical(other.shift, shift) || other.shift == shift)&&(identical(other.email, email) || other.email == email)&&(identical(other.alamatEmail, alamatEmail) || other.alamatEmail == alamatEmail));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hashAll([runtimeType,id,idKaryawan,namaKaryawan,tanggal,waktuCheckIn,waktuCheckOut,bluetoothID,alamatLongtitude,alamatLatitude,alamatLoc,const DeepCollectionEquality().hash(telat),foto,fotoKaryawan,idPerusahaan,namaperusahaan,tanggalAbsensi,fotoPulang,latitudePulang,longtitudePulang,durasi,alamatPulang,fotoIsitrahatIn,fotoIstirahatOut,istirahatIn,istirahatOut,latistirahatin,longistirahatin,alamatistirahatin,latistirahatout,longistirahatout,alamatistirahatout,status,shift,email,alamatEmail]);

@override
String toString() {
  return 'Absence(id: $id, idKaryawan: $idKaryawan, namaKaryawan: $namaKaryawan, tanggal: $tanggal, waktuCheckIn: $waktuCheckIn, waktuCheckOut: $waktuCheckOut, bluetoothID: $bluetoothID, alamatLongtitude: $alamatLongtitude, alamatLatitude: $alamatLatitude, alamatLoc: $alamatLoc, telat: $telat, foto: $foto, fotoKaryawan: $fotoKaryawan, idPerusahaan: $idPerusahaan, namaperusahaan: $namaperusahaan, tanggalAbsensi: $tanggalAbsensi, fotoPulang: $fotoPulang, latitudePulang: $latitudePulang, longtitudePulang: $longtitudePulang, durasi: $durasi, alamatPulang: $alamatPulang, fotoIsitrahatIn: $fotoIsitrahatIn, fotoIstirahatOut: $fotoIstirahatOut, istirahatIn: $istirahatIn, istirahatOut: $istirahatOut, latistirahatin: $latistirahatin, longistirahatin: $longistirahatin, alamatistirahatin: $alamatistirahatin, latistirahatout: $latistirahatout, longistirahatout: $longistirahatout, alamatistirahatout: $alamatistirahatout, status: $status, shift: $shift, email: $email, alamatEmail: $alamatEmail)';
}


}

/// @nodoc
abstract mixin class _$AbsenceCopyWith<$Res> implements $AbsenceCopyWith<$Res> {
  factory _$AbsenceCopyWith(_Absence value, $Res Function(_Absence) _then) = __$AbsenceCopyWithImpl;
@override @useResult
$Res call({
@JsonKey(fromJson: _stringFromAny) String? id, String? idKaryawan, String? namaKaryawan,@FirestoreDateTimeConverter() DateTime? tanggal,@FirestoreDateTimeConverter() DateTime? waktuCheckIn,@FirestoreDateTimeConverter() DateTime? waktuCheckOut, String? bluetoothID, String? alamatLongtitude, String? alamatLatitude, String? alamatLoc, dynamic telat, String? foto, String? fotoKaryawan, String? idPerusahaan, String? namaperusahaan,@FirestoreDateTimeConverter() DateTime? tanggalAbsensi, String? fotoPulang, String? latitudePulang, String? longtitudePulang, String? durasi, String? alamatPulang, String? fotoIsitrahatIn, String? fotoIstirahatOut,@FirestoreDateTimeConverter() DateTime? istirahatIn,@FirestoreDateTimeConverter() DateTime? istirahatOut, String? latistirahatin, String? longistirahatin, String? alamatistirahatin, String? latistirahatout, String? longistirahatout, String? alamatistirahatout, String? status, String? shift, String? email, String? alamatEmail
});




}
/// @nodoc
class __$AbsenceCopyWithImpl<$Res>
    implements _$AbsenceCopyWith<$Res> {
  __$AbsenceCopyWithImpl(this._self, this._then);

  final _Absence _self;
  final $Res Function(_Absence) _then;

/// Create a copy of Absence
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = freezed,Object? idKaryawan = freezed,Object? namaKaryawan = freezed,Object? tanggal = freezed,Object? waktuCheckIn = freezed,Object? waktuCheckOut = freezed,Object? bluetoothID = freezed,Object? alamatLongtitude = freezed,Object? alamatLatitude = freezed,Object? alamatLoc = freezed,Object? telat = freezed,Object? foto = freezed,Object? fotoKaryawan = freezed,Object? idPerusahaan = freezed,Object? namaperusahaan = freezed,Object? tanggalAbsensi = freezed,Object? fotoPulang = freezed,Object? latitudePulang = freezed,Object? longtitudePulang = freezed,Object? durasi = freezed,Object? alamatPulang = freezed,Object? fotoIsitrahatIn = freezed,Object? fotoIstirahatOut = freezed,Object? istirahatIn = freezed,Object? istirahatOut = freezed,Object? latistirahatin = freezed,Object? longistirahatin = freezed,Object? alamatistirahatin = freezed,Object? latistirahatout = freezed,Object? longistirahatout = freezed,Object? alamatistirahatout = freezed,Object? status = freezed,Object? shift = freezed,Object? email = freezed,Object? alamatEmail = freezed,}) {
  return _then(_Absence(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String?,idKaryawan: freezed == idKaryawan ? _self.idKaryawan : idKaryawan // ignore: cast_nullable_to_non_nullable
as String?,namaKaryawan: freezed == namaKaryawan ? _self.namaKaryawan : namaKaryawan // ignore: cast_nullable_to_non_nullable
as String?,tanggal: freezed == tanggal ? _self.tanggal : tanggal // ignore: cast_nullable_to_non_nullable
as DateTime?,waktuCheckIn: freezed == waktuCheckIn ? _self.waktuCheckIn : waktuCheckIn // ignore: cast_nullable_to_non_nullable
as DateTime?,waktuCheckOut: freezed == waktuCheckOut ? _self.waktuCheckOut : waktuCheckOut // ignore: cast_nullable_to_non_nullable
as DateTime?,bluetoothID: freezed == bluetoothID ? _self.bluetoothID : bluetoothID // ignore: cast_nullable_to_non_nullable
as String?,alamatLongtitude: freezed == alamatLongtitude ? _self.alamatLongtitude : alamatLongtitude // ignore: cast_nullable_to_non_nullable
as String?,alamatLatitude: freezed == alamatLatitude ? _self.alamatLatitude : alamatLatitude // ignore: cast_nullable_to_non_nullable
as String?,alamatLoc: freezed == alamatLoc ? _self.alamatLoc : alamatLoc // ignore: cast_nullable_to_non_nullable
as String?,telat: freezed == telat ? _self.telat : telat // ignore: cast_nullable_to_non_nullable
as dynamic,foto: freezed == foto ? _self.foto : foto // ignore: cast_nullable_to_non_nullable
as String?,fotoKaryawan: freezed == fotoKaryawan ? _self.fotoKaryawan : fotoKaryawan // ignore: cast_nullable_to_non_nullable
as String?,idPerusahaan: freezed == idPerusahaan ? _self.idPerusahaan : idPerusahaan // ignore: cast_nullable_to_non_nullable
as String?,namaperusahaan: freezed == namaperusahaan ? _self.namaperusahaan : namaperusahaan // ignore: cast_nullable_to_non_nullable
as String?,tanggalAbsensi: freezed == tanggalAbsensi ? _self.tanggalAbsensi : tanggalAbsensi // ignore: cast_nullable_to_non_nullable
as DateTime?,fotoPulang: freezed == fotoPulang ? _self.fotoPulang : fotoPulang // ignore: cast_nullable_to_non_nullable
as String?,latitudePulang: freezed == latitudePulang ? _self.latitudePulang : latitudePulang // ignore: cast_nullable_to_non_nullable
as String?,longtitudePulang: freezed == longtitudePulang ? _self.longtitudePulang : longtitudePulang // ignore: cast_nullable_to_non_nullable
as String?,durasi: freezed == durasi ? _self.durasi : durasi // ignore: cast_nullable_to_non_nullable
as String?,alamatPulang: freezed == alamatPulang ? _self.alamatPulang : alamatPulang // ignore: cast_nullable_to_non_nullable
as String?,fotoIsitrahatIn: freezed == fotoIsitrahatIn ? _self.fotoIsitrahatIn : fotoIsitrahatIn // ignore: cast_nullable_to_non_nullable
as String?,fotoIstirahatOut: freezed == fotoIstirahatOut ? _self.fotoIstirahatOut : fotoIstirahatOut // ignore: cast_nullable_to_non_nullable
as String?,istirahatIn: freezed == istirahatIn ? _self.istirahatIn : istirahatIn // ignore: cast_nullable_to_non_nullable
as DateTime?,istirahatOut: freezed == istirahatOut ? _self.istirahatOut : istirahatOut // ignore: cast_nullable_to_non_nullable
as DateTime?,latistirahatin: freezed == latistirahatin ? _self.latistirahatin : latistirahatin // ignore: cast_nullable_to_non_nullable
as String?,longistirahatin: freezed == longistirahatin ? _self.longistirahatin : longistirahatin // ignore: cast_nullable_to_non_nullable
as String?,alamatistirahatin: freezed == alamatistirahatin ? _self.alamatistirahatin : alamatistirahatin // ignore: cast_nullable_to_non_nullable
as String?,latistirahatout: freezed == latistirahatout ? _self.latistirahatout : latistirahatout // ignore: cast_nullable_to_non_nullable
as String?,longistirahatout: freezed == longistirahatout ? _self.longistirahatout : longistirahatout // ignore: cast_nullable_to_non_nullable
as String?,alamatistirahatout: freezed == alamatistirahatout ? _self.alamatistirahatout : alamatistirahatout // ignore: cast_nullable_to_non_nullable
as String?,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,shift: freezed == shift ? _self.shift : shift // ignore: cast_nullable_to_non_nullable
as String?,email: freezed == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String?,alamatEmail: freezed == alamatEmail ? _self.alamatEmail : alamatEmail // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
