// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'staff.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Staff {

 String? get namaKaryawan; String? get liked; String? get alamatEmail; String? get noHp; String? get namaPerusahaan; String? get idperusahaan; String? get alamatLongtitude; String? get alamatLatitude; String? get alamatLoc; String? get foto;@JsonKey(fromJson: _dateTimeFromIsoString, toJson: _dateTimeToIsoString) DateTime? get joinDate; String? get status; String? get fcmToken; int get id; String? get idkaryawan; String? get gender; String? get jabatan;
/// Create a copy of Staff
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$StaffCopyWith<Staff> get copyWith => _$StaffCopyWithImpl<Staff>(this as Staff, _$identity);

  /// Serializes this Staff to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Staff&&(identical(other.namaKaryawan, namaKaryawan) || other.namaKaryawan == namaKaryawan)&&(identical(other.liked, liked) || other.liked == liked)&&(identical(other.alamatEmail, alamatEmail) || other.alamatEmail == alamatEmail)&&(identical(other.noHp, noHp) || other.noHp == noHp)&&(identical(other.namaPerusahaan, namaPerusahaan) || other.namaPerusahaan == namaPerusahaan)&&(identical(other.idperusahaan, idperusahaan) || other.idperusahaan == idperusahaan)&&(identical(other.alamatLongtitude, alamatLongtitude) || other.alamatLongtitude == alamatLongtitude)&&(identical(other.alamatLatitude, alamatLatitude) || other.alamatLatitude == alamatLatitude)&&(identical(other.alamatLoc, alamatLoc) || other.alamatLoc == alamatLoc)&&(identical(other.foto, foto) || other.foto == foto)&&(identical(other.joinDate, joinDate) || other.joinDate == joinDate)&&(identical(other.status, status) || other.status == status)&&(identical(other.fcmToken, fcmToken) || other.fcmToken == fcmToken)&&(identical(other.id, id) || other.id == id)&&(identical(other.idkaryawan, idkaryawan) || other.idkaryawan == idkaryawan)&&(identical(other.gender, gender) || other.gender == gender)&&(identical(other.jabatan, jabatan) || other.jabatan == jabatan));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,namaKaryawan,liked,alamatEmail,noHp,namaPerusahaan,idperusahaan,alamatLongtitude,alamatLatitude,alamatLoc,foto,joinDate,status,fcmToken,id,idkaryawan,gender,jabatan);

@override
String toString() {
  return 'Staff(namaKaryawan: $namaKaryawan, liked: $liked, alamatEmail: $alamatEmail, noHp: $noHp, namaPerusahaan: $namaPerusahaan, idperusahaan: $idperusahaan, alamatLongtitude: $alamatLongtitude, alamatLatitude: $alamatLatitude, alamatLoc: $alamatLoc, foto: $foto, joinDate: $joinDate, status: $status, fcmToken: $fcmToken, id: $id, idkaryawan: $idkaryawan, gender: $gender, jabatan: $jabatan)';
}


}

/// @nodoc
abstract mixin class $StaffCopyWith<$Res>  {
  factory $StaffCopyWith(Staff value, $Res Function(Staff) _then) = _$StaffCopyWithImpl;
@useResult
$Res call({
 String? namaKaryawan, String? liked, String? alamatEmail, String? noHp, String? namaPerusahaan, String? idperusahaan, String? alamatLongtitude, String? alamatLatitude, String? alamatLoc, String? foto,@JsonKey(fromJson: _dateTimeFromIsoString, toJson: _dateTimeToIsoString) DateTime? joinDate, String? status, String? fcmToken, int id, String? idkaryawan, String? gender, String? jabatan
});




}
/// @nodoc
class _$StaffCopyWithImpl<$Res>
    implements $StaffCopyWith<$Res> {
  _$StaffCopyWithImpl(this._self, this._then);

  final Staff _self;
  final $Res Function(Staff) _then;

/// Create a copy of Staff
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? namaKaryawan = freezed,Object? liked = freezed,Object? alamatEmail = freezed,Object? noHp = freezed,Object? namaPerusahaan = freezed,Object? idperusahaan = freezed,Object? alamatLongtitude = freezed,Object? alamatLatitude = freezed,Object? alamatLoc = freezed,Object? foto = freezed,Object? joinDate = freezed,Object? status = freezed,Object? fcmToken = freezed,Object? id = null,Object? idkaryawan = freezed,Object? gender = freezed,Object? jabatan = freezed,}) {
  return _then(_self.copyWith(
namaKaryawan: freezed == namaKaryawan ? _self.namaKaryawan : namaKaryawan // ignore: cast_nullable_to_non_nullable
as String?,liked: freezed == liked ? _self.liked : liked // ignore: cast_nullable_to_non_nullable
as String?,alamatEmail: freezed == alamatEmail ? _self.alamatEmail : alamatEmail // ignore: cast_nullable_to_non_nullable
as String?,noHp: freezed == noHp ? _self.noHp : noHp // ignore: cast_nullable_to_non_nullable
as String?,namaPerusahaan: freezed == namaPerusahaan ? _self.namaPerusahaan : namaPerusahaan // ignore: cast_nullable_to_non_nullable
as String?,idperusahaan: freezed == idperusahaan ? _self.idperusahaan : idperusahaan // ignore: cast_nullable_to_non_nullable
as String?,alamatLongtitude: freezed == alamatLongtitude ? _self.alamatLongtitude : alamatLongtitude // ignore: cast_nullable_to_non_nullable
as String?,alamatLatitude: freezed == alamatLatitude ? _self.alamatLatitude : alamatLatitude // ignore: cast_nullable_to_non_nullable
as String?,alamatLoc: freezed == alamatLoc ? _self.alamatLoc : alamatLoc // ignore: cast_nullable_to_non_nullable
as String?,foto: freezed == foto ? _self.foto : foto // ignore: cast_nullable_to_non_nullable
as String?,joinDate: freezed == joinDate ? _self.joinDate : joinDate // ignore: cast_nullable_to_non_nullable
as DateTime?,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,fcmToken: freezed == fcmToken ? _self.fcmToken : fcmToken // ignore: cast_nullable_to_non_nullable
as String?,id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,idkaryawan: freezed == idkaryawan ? _self.idkaryawan : idkaryawan // ignore: cast_nullable_to_non_nullable
as String?,gender: freezed == gender ? _self.gender : gender // ignore: cast_nullable_to_non_nullable
as String?,jabatan: freezed == jabatan ? _self.jabatan : jabatan // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [Staff].
extension StaffPatterns on Staff {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Staff value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Staff() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Staff value)  $default,){
final _that = this;
switch (_that) {
case _Staff():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Staff value)?  $default,){
final _that = this;
switch (_that) {
case _Staff() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String? namaKaryawan,  String? liked,  String? alamatEmail,  String? noHp,  String? namaPerusahaan,  String? idperusahaan,  String? alamatLongtitude,  String? alamatLatitude,  String? alamatLoc,  String? foto, @JsonKey(fromJson: _dateTimeFromIsoString, toJson: _dateTimeToIsoString)  DateTime? joinDate,  String? status,  String? fcmToken,  int id,  String? idkaryawan,  String? gender,  String? jabatan)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Staff() when $default != null:
return $default(_that.namaKaryawan,_that.liked,_that.alamatEmail,_that.noHp,_that.namaPerusahaan,_that.idperusahaan,_that.alamatLongtitude,_that.alamatLatitude,_that.alamatLoc,_that.foto,_that.joinDate,_that.status,_that.fcmToken,_that.id,_that.idkaryawan,_that.gender,_that.jabatan);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String? namaKaryawan,  String? liked,  String? alamatEmail,  String? noHp,  String? namaPerusahaan,  String? idperusahaan,  String? alamatLongtitude,  String? alamatLatitude,  String? alamatLoc,  String? foto, @JsonKey(fromJson: _dateTimeFromIsoString, toJson: _dateTimeToIsoString)  DateTime? joinDate,  String? status,  String? fcmToken,  int id,  String? idkaryawan,  String? gender,  String? jabatan)  $default,) {final _that = this;
switch (_that) {
case _Staff():
return $default(_that.namaKaryawan,_that.liked,_that.alamatEmail,_that.noHp,_that.namaPerusahaan,_that.idperusahaan,_that.alamatLongtitude,_that.alamatLatitude,_that.alamatLoc,_that.foto,_that.joinDate,_that.status,_that.fcmToken,_that.id,_that.idkaryawan,_that.gender,_that.jabatan);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String? namaKaryawan,  String? liked,  String? alamatEmail,  String? noHp,  String? namaPerusahaan,  String? idperusahaan,  String? alamatLongtitude,  String? alamatLatitude,  String? alamatLoc,  String? foto, @JsonKey(fromJson: _dateTimeFromIsoString, toJson: _dateTimeToIsoString)  DateTime? joinDate,  String? status,  String? fcmToken,  int id,  String? idkaryawan,  String? gender,  String? jabatan)?  $default,) {final _that = this;
switch (_that) {
case _Staff() when $default != null:
return $default(_that.namaKaryawan,_that.liked,_that.alamatEmail,_that.noHp,_that.namaPerusahaan,_that.idperusahaan,_that.alamatLongtitude,_that.alamatLatitude,_that.alamatLoc,_that.foto,_that.joinDate,_that.status,_that.fcmToken,_that.id,_that.idkaryawan,_that.gender,_that.jabatan);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Staff implements Staff {
  const _Staff({required this.namaKaryawan, required this.liked, required this.alamatEmail, required this.noHp, required this.namaPerusahaan, required this.idperusahaan, required this.alamatLongtitude, required this.alamatLatitude, required this.alamatLoc, required this.foto, @JsonKey(fromJson: _dateTimeFromIsoString, toJson: _dateTimeToIsoString) required this.joinDate, required this.status, required this.fcmToken, required this.id, required this.idkaryawan, required this.gender, required this.jabatan});
  factory _Staff.fromJson(Map<String, dynamic> json) => _$StaffFromJson(json);

@override final  String? namaKaryawan;
@override final  String? liked;
@override final  String? alamatEmail;
@override final  String? noHp;
@override final  String? namaPerusahaan;
@override final  String? idperusahaan;
@override final  String? alamatLongtitude;
@override final  String? alamatLatitude;
@override final  String? alamatLoc;
@override final  String? foto;
@override@JsonKey(fromJson: _dateTimeFromIsoString, toJson: _dateTimeToIsoString) final  DateTime? joinDate;
@override final  String? status;
@override final  String? fcmToken;
@override final  int id;
@override final  String? idkaryawan;
@override final  String? gender;
@override final  String? jabatan;

/// Create a copy of Staff
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$StaffCopyWith<_Staff> get copyWith => __$StaffCopyWithImpl<_Staff>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$StaffToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Staff&&(identical(other.namaKaryawan, namaKaryawan) || other.namaKaryawan == namaKaryawan)&&(identical(other.liked, liked) || other.liked == liked)&&(identical(other.alamatEmail, alamatEmail) || other.alamatEmail == alamatEmail)&&(identical(other.noHp, noHp) || other.noHp == noHp)&&(identical(other.namaPerusahaan, namaPerusahaan) || other.namaPerusahaan == namaPerusahaan)&&(identical(other.idperusahaan, idperusahaan) || other.idperusahaan == idperusahaan)&&(identical(other.alamatLongtitude, alamatLongtitude) || other.alamatLongtitude == alamatLongtitude)&&(identical(other.alamatLatitude, alamatLatitude) || other.alamatLatitude == alamatLatitude)&&(identical(other.alamatLoc, alamatLoc) || other.alamatLoc == alamatLoc)&&(identical(other.foto, foto) || other.foto == foto)&&(identical(other.joinDate, joinDate) || other.joinDate == joinDate)&&(identical(other.status, status) || other.status == status)&&(identical(other.fcmToken, fcmToken) || other.fcmToken == fcmToken)&&(identical(other.id, id) || other.id == id)&&(identical(other.idkaryawan, idkaryawan) || other.idkaryawan == idkaryawan)&&(identical(other.gender, gender) || other.gender == gender)&&(identical(other.jabatan, jabatan) || other.jabatan == jabatan));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,namaKaryawan,liked,alamatEmail,noHp,namaPerusahaan,idperusahaan,alamatLongtitude,alamatLatitude,alamatLoc,foto,joinDate,status,fcmToken,id,idkaryawan,gender,jabatan);

@override
String toString() {
  return 'Staff(namaKaryawan: $namaKaryawan, liked: $liked, alamatEmail: $alamatEmail, noHp: $noHp, namaPerusahaan: $namaPerusahaan, idperusahaan: $idperusahaan, alamatLongtitude: $alamatLongtitude, alamatLatitude: $alamatLatitude, alamatLoc: $alamatLoc, foto: $foto, joinDate: $joinDate, status: $status, fcmToken: $fcmToken, id: $id, idkaryawan: $idkaryawan, gender: $gender, jabatan: $jabatan)';
}


}

/// @nodoc
abstract mixin class _$StaffCopyWith<$Res> implements $StaffCopyWith<$Res> {
  factory _$StaffCopyWith(_Staff value, $Res Function(_Staff) _then) = __$StaffCopyWithImpl;
@override @useResult
$Res call({
 String? namaKaryawan, String? liked, String? alamatEmail, String? noHp, String? namaPerusahaan, String? idperusahaan, String? alamatLongtitude, String? alamatLatitude, String? alamatLoc, String? foto,@JsonKey(fromJson: _dateTimeFromIsoString, toJson: _dateTimeToIsoString) DateTime? joinDate, String? status, String? fcmToken, int id, String? idkaryawan, String? gender, String? jabatan
});




}
/// @nodoc
class __$StaffCopyWithImpl<$Res>
    implements _$StaffCopyWith<$Res> {
  __$StaffCopyWithImpl(this._self, this._then);

  final _Staff _self;
  final $Res Function(_Staff) _then;

/// Create a copy of Staff
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? namaKaryawan = freezed,Object? liked = freezed,Object? alamatEmail = freezed,Object? noHp = freezed,Object? namaPerusahaan = freezed,Object? idperusahaan = freezed,Object? alamatLongtitude = freezed,Object? alamatLatitude = freezed,Object? alamatLoc = freezed,Object? foto = freezed,Object? joinDate = freezed,Object? status = freezed,Object? fcmToken = freezed,Object? id = null,Object? idkaryawan = freezed,Object? gender = freezed,Object? jabatan = freezed,}) {
  return _then(_Staff(
namaKaryawan: freezed == namaKaryawan ? _self.namaKaryawan : namaKaryawan // ignore: cast_nullable_to_non_nullable
as String?,liked: freezed == liked ? _self.liked : liked // ignore: cast_nullable_to_non_nullable
as String?,alamatEmail: freezed == alamatEmail ? _self.alamatEmail : alamatEmail // ignore: cast_nullable_to_non_nullable
as String?,noHp: freezed == noHp ? _self.noHp : noHp // ignore: cast_nullable_to_non_nullable
as String?,namaPerusahaan: freezed == namaPerusahaan ? _self.namaPerusahaan : namaPerusahaan // ignore: cast_nullable_to_non_nullable
as String?,idperusahaan: freezed == idperusahaan ? _self.idperusahaan : idperusahaan // ignore: cast_nullable_to_non_nullable
as String?,alamatLongtitude: freezed == alamatLongtitude ? _self.alamatLongtitude : alamatLongtitude // ignore: cast_nullable_to_non_nullable
as String?,alamatLatitude: freezed == alamatLatitude ? _self.alamatLatitude : alamatLatitude // ignore: cast_nullable_to_non_nullable
as String?,alamatLoc: freezed == alamatLoc ? _self.alamatLoc : alamatLoc // ignore: cast_nullable_to_non_nullable
as String?,foto: freezed == foto ? _self.foto : foto // ignore: cast_nullable_to_non_nullable
as String?,joinDate: freezed == joinDate ? _self.joinDate : joinDate // ignore: cast_nullable_to_non_nullable
as DateTime?,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,fcmToken: freezed == fcmToken ? _self.fcmToken : fcmToken // ignore: cast_nullable_to_non_nullable
as String?,id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int,idkaryawan: freezed == idkaryawan ? _self.idkaryawan : idkaryawan // ignore: cast_nullable_to_non_nullable
as String?,gender: freezed == gender ? _self.gender : gender // ignore: cast_nullable_to_non_nullable
as String?,jabatan: freezed == jabatan ? _self.jabatan : jabatan // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
