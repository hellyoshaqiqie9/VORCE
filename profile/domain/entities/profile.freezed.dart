// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'profile.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Profile {

 int? get id;@JsonKey(name: 'namaKaryawan') String get name;@JsonKey(name: 'liked') String get liked;@JsonKey(name: 'alamatEmail') String get email;@JsonKey(name: 'noHP') String? get phone;@JsonKey(name: 'namaPerusahaan') String? get perusahaan;@JsonKey(name: 'idperusahaan') String? get perusahaanId;@JsonKey(name: 'alamatLongtitude') String? get longitude;@JsonKey(name: 'alamatLatitude') String? get latitude;@JsonKey(name: 'alamatLoc') String? get address;@FullPathOptionalImageConverter()@JsonKey(name: 'foto') String get photo;@JsonKey(name: 'joinDate') String? get joinDate;@JsonKey(name: 'status') String? get status;@JsonKey(name: 'fcmToken') String? get fcmToken;@JsonKey(name: 'idkaryawan') String? get idkaryawan;@JsonKey(name: 'gender') String? get gender;@JsonKey(name: 'jabatan') String? get jabatan;
/// Create a copy of Profile
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$ProfileCopyWith<Profile> get copyWith => _$ProfileCopyWithImpl<Profile>(this as Profile, _$identity);

  /// Serializes this Profile to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Profile&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.liked, liked) || other.liked == liked)&&(identical(other.email, email) || other.email == email)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.perusahaan, perusahaan) || other.perusahaan == perusahaan)&&(identical(other.perusahaanId, perusahaanId) || other.perusahaanId == perusahaanId)&&(identical(other.longitude, longitude) || other.longitude == longitude)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.address, address) || other.address == address)&&(identical(other.photo, photo) || other.photo == photo)&&(identical(other.joinDate, joinDate) || other.joinDate == joinDate)&&(identical(other.status, status) || other.status == status)&&(identical(other.fcmToken, fcmToken) || other.fcmToken == fcmToken)&&(identical(other.idkaryawan, idkaryawan) || other.idkaryawan == idkaryawan)&&(identical(other.gender, gender) || other.gender == gender)&&(identical(other.jabatan, jabatan) || other.jabatan == jabatan));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,liked,email,phone,perusahaan,perusahaanId,longitude,latitude,address,photo,joinDate,status,fcmToken,idkaryawan,gender,jabatan);

@override
String toString() {
  return 'Profile(id: $id, name: $name, liked: $liked, email: $email, phone: $phone, perusahaan: $perusahaan, perusahaanId: $perusahaanId, longitude: $longitude, latitude: $latitude, address: $address, photo: $photo, joinDate: $joinDate, status: $status, fcmToken: $fcmToken, idkaryawan: $idkaryawan, gender: $gender, jabatan: $jabatan)';
}


}

/// @nodoc
abstract mixin class $ProfileCopyWith<$Res>  {
  factory $ProfileCopyWith(Profile value, $Res Function(Profile) _then) = _$ProfileCopyWithImpl;
@useResult
$Res call({
 int? id,@JsonKey(name: 'namaKaryawan') String name,@JsonKey(name: 'liked') String liked,@JsonKey(name: 'alamatEmail') String email,@JsonKey(name: 'noHP') String? phone,@JsonKey(name: 'namaPerusahaan') String? perusahaan,@JsonKey(name: 'idperusahaan') String? perusahaanId,@JsonKey(name: 'alamatLongtitude') String? longitude,@JsonKey(name: 'alamatLatitude') String? latitude,@JsonKey(name: 'alamatLoc') String? address,@FullPathOptionalImageConverter()@JsonKey(name: 'foto') String photo,@JsonKey(name: 'joinDate') String? joinDate,@JsonKey(name: 'status') String? status,@JsonKey(name: 'fcmToken') String? fcmToken,@JsonKey(name: 'idkaryawan') String? idkaryawan,@JsonKey(name: 'gender') String? gender,@JsonKey(name: 'jabatan') String? jabatan
});




}
/// @nodoc
class _$ProfileCopyWithImpl<$Res>
    implements $ProfileCopyWith<$Res> {
  _$ProfileCopyWithImpl(this._self, this._then);

  final Profile _self;
  final $Res Function(Profile) _then;

/// Create a copy of Profile
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = freezed,Object? name = null,Object? liked = null,Object? email = null,Object? phone = freezed,Object? perusahaan = freezed,Object? perusahaanId = freezed,Object? longitude = freezed,Object? latitude = freezed,Object? address = freezed,Object? photo = null,Object? joinDate = freezed,Object? status = freezed,Object? fcmToken = freezed,Object? idkaryawan = freezed,Object? gender = freezed,Object? jabatan = freezed,}) {
  return _then(_self.copyWith(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int?,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,liked: null == liked ? _self.liked : liked // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,perusahaan: freezed == perusahaan ? _self.perusahaan : perusahaan // ignore: cast_nullable_to_non_nullable
as String?,perusahaanId: freezed == perusahaanId ? _self.perusahaanId : perusahaanId // ignore: cast_nullable_to_non_nullable
as String?,longitude: freezed == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as String?,latitude: freezed == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as String?,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,photo: null == photo ? _self.photo : photo // ignore: cast_nullable_to_non_nullable
as String,joinDate: freezed == joinDate ? _self.joinDate : joinDate // ignore: cast_nullable_to_non_nullable
as String?,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,fcmToken: freezed == fcmToken ? _self.fcmToken : fcmToken // ignore: cast_nullable_to_non_nullable
as String?,idkaryawan: freezed == idkaryawan ? _self.idkaryawan : idkaryawan // ignore: cast_nullable_to_non_nullable
as String?,gender: freezed == gender ? _self.gender : gender // ignore: cast_nullable_to_non_nullable
as String?,jabatan: freezed == jabatan ? _self.jabatan : jabatan // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [Profile].
extension ProfilePatterns on Profile {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Profile value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Profile() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Profile value)  $default,){
final _that = this;
switch (_that) {
case _Profile():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Profile value)?  $default,){
final _that = this;
switch (_that) {
case _Profile() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( int? id, @JsonKey(name: 'namaKaryawan')  String name, @JsonKey(name: 'liked')  String liked, @JsonKey(name: 'alamatEmail')  String email, @JsonKey(name: 'noHP')  String? phone, @JsonKey(name: 'namaPerusahaan')  String? perusahaan, @JsonKey(name: 'idperusahaan')  String? perusahaanId, @JsonKey(name: 'alamatLongtitude')  String? longitude, @JsonKey(name: 'alamatLatitude')  String? latitude, @JsonKey(name: 'alamatLoc')  String? address, @FullPathOptionalImageConverter()@JsonKey(name: 'foto')  String photo, @JsonKey(name: 'joinDate')  String? joinDate, @JsonKey(name: 'status')  String? status, @JsonKey(name: 'fcmToken')  String? fcmToken, @JsonKey(name: 'idkaryawan')  String? idkaryawan, @JsonKey(name: 'gender')  String? gender, @JsonKey(name: 'jabatan')  String? jabatan)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Profile() when $default != null:
return $default(_that.id,_that.name,_that.liked,_that.email,_that.phone,_that.perusahaan,_that.perusahaanId,_that.longitude,_that.latitude,_that.address,_that.photo,_that.joinDate,_that.status,_that.fcmToken,_that.idkaryawan,_that.gender,_that.jabatan);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( int? id, @JsonKey(name: 'namaKaryawan')  String name, @JsonKey(name: 'liked')  String liked, @JsonKey(name: 'alamatEmail')  String email, @JsonKey(name: 'noHP')  String? phone, @JsonKey(name: 'namaPerusahaan')  String? perusahaan, @JsonKey(name: 'idperusahaan')  String? perusahaanId, @JsonKey(name: 'alamatLongtitude')  String? longitude, @JsonKey(name: 'alamatLatitude')  String? latitude, @JsonKey(name: 'alamatLoc')  String? address, @FullPathOptionalImageConverter()@JsonKey(name: 'foto')  String photo, @JsonKey(name: 'joinDate')  String? joinDate, @JsonKey(name: 'status')  String? status, @JsonKey(name: 'fcmToken')  String? fcmToken, @JsonKey(name: 'idkaryawan')  String? idkaryawan, @JsonKey(name: 'gender')  String? gender, @JsonKey(name: 'jabatan')  String? jabatan)  $default,) {final _that = this;
switch (_that) {
case _Profile():
return $default(_that.id,_that.name,_that.liked,_that.email,_that.phone,_that.perusahaan,_that.perusahaanId,_that.longitude,_that.latitude,_that.address,_that.photo,_that.joinDate,_that.status,_that.fcmToken,_that.idkaryawan,_that.gender,_that.jabatan);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( int? id, @JsonKey(name: 'namaKaryawan')  String name, @JsonKey(name: 'liked')  String liked, @JsonKey(name: 'alamatEmail')  String email, @JsonKey(name: 'noHP')  String? phone, @JsonKey(name: 'namaPerusahaan')  String? perusahaan, @JsonKey(name: 'idperusahaan')  String? perusahaanId, @JsonKey(name: 'alamatLongtitude')  String? longitude, @JsonKey(name: 'alamatLatitude')  String? latitude, @JsonKey(name: 'alamatLoc')  String? address, @FullPathOptionalImageConverter()@JsonKey(name: 'foto')  String photo, @JsonKey(name: 'joinDate')  String? joinDate, @JsonKey(name: 'status')  String? status, @JsonKey(name: 'fcmToken')  String? fcmToken, @JsonKey(name: 'idkaryawan')  String? idkaryawan, @JsonKey(name: 'gender')  String? gender, @JsonKey(name: 'jabatan')  String? jabatan)?  $default,) {final _that = this;
switch (_that) {
case _Profile() when $default != null:
return $default(_that.id,_that.name,_that.liked,_that.email,_that.phone,_that.perusahaan,_that.perusahaanId,_that.longitude,_that.latitude,_that.address,_that.photo,_that.joinDate,_that.status,_that.fcmToken,_that.idkaryawan,_that.gender,_that.jabatan);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Profile implements Profile {
  const _Profile({this.id, @JsonKey(name: 'namaKaryawan') required this.name, @JsonKey(name: 'liked') this.liked = 'no', @JsonKey(name: 'alamatEmail') required this.email, @JsonKey(name: 'noHP') this.phone, @JsonKey(name: 'namaPerusahaan') this.perusahaan, @JsonKey(name: 'idperusahaan') this.perusahaanId, @JsonKey(name: 'alamatLongtitude') this.longitude, @JsonKey(name: 'alamatLatitude') this.latitude, @JsonKey(name: 'alamatLoc') this.address, @FullPathOptionalImageConverter()@JsonKey(name: 'foto') this.photo = 'https://api.horaapp.id/images/companylogo/horawatermark.png', @JsonKey(name: 'joinDate') this.joinDate, @JsonKey(name: 'status') this.status, @JsonKey(name: 'fcmToken') this.fcmToken, @JsonKey(name: 'idkaryawan') this.idkaryawan, @JsonKey(name: 'gender') this.gender, @JsonKey(name: 'jabatan') this.jabatan});
  factory _Profile.fromJson(Map<String, dynamic> json) => _$ProfileFromJson(json);

@override final  int? id;
@override@JsonKey(name: 'namaKaryawan') final  String name;
@override@JsonKey(name: 'liked') final  String liked;
@override@JsonKey(name: 'alamatEmail') final  String email;
@override@JsonKey(name: 'noHP') final  String? phone;
@override@JsonKey(name: 'namaPerusahaan') final  String? perusahaan;
@override@JsonKey(name: 'idperusahaan') final  String? perusahaanId;
@override@JsonKey(name: 'alamatLongtitude') final  String? longitude;
@override@JsonKey(name: 'alamatLatitude') final  String? latitude;
@override@JsonKey(name: 'alamatLoc') final  String? address;
@override@FullPathOptionalImageConverter()@JsonKey(name: 'foto') final  String photo;
@override@JsonKey(name: 'joinDate') final  String? joinDate;
@override@JsonKey(name: 'status') final  String? status;
@override@JsonKey(name: 'fcmToken') final  String? fcmToken;
@override@JsonKey(name: 'idkaryawan') final  String? idkaryawan;
@override@JsonKey(name: 'gender') final  String? gender;
@override@JsonKey(name: 'jabatan') final  String? jabatan;

/// Create a copy of Profile
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$ProfileCopyWith<_Profile> get copyWith => __$ProfileCopyWithImpl<_Profile>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$ProfileToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Profile&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.liked, liked) || other.liked == liked)&&(identical(other.email, email) || other.email == email)&&(identical(other.phone, phone) || other.phone == phone)&&(identical(other.perusahaan, perusahaan) || other.perusahaan == perusahaan)&&(identical(other.perusahaanId, perusahaanId) || other.perusahaanId == perusahaanId)&&(identical(other.longitude, longitude) || other.longitude == longitude)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.address, address) || other.address == address)&&(identical(other.photo, photo) || other.photo == photo)&&(identical(other.joinDate, joinDate) || other.joinDate == joinDate)&&(identical(other.status, status) || other.status == status)&&(identical(other.fcmToken, fcmToken) || other.fcmToken == fcmToken)&&(identical(other.idkaryawan, idkaryawan) || other.idkaryawan == idkaryawan)&&(identical(other.gender, gender) || other.gender == gender)&&(identical(other.jabatan, jabatan) || other.jabatan == jabatan));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,liked,email,phone,perusahaan,perusahaanId,longitude,latitude,address,photo,joinDate,status,fcmToken,idkaryawan,gender,jabatan);

@override
String toString() {
  return 'Profile(id: $id, name: $name, liked: $liked, email: $email, phone: $phone, perusahaan: $perusahaan, perusahaanId: $perusahaanId, longitude: $longitude, latitude: $latitude, address: $address, photo: $photo, joinDate: $joinDate, status: $status, fcmToken: $fcmToken, idkaryawan: $idkaryawan, gender: $gender, jabatan: $jabatan)';
}


}

/// @nodoc
abstract mixin class _$ProfileCopyWith<$Res> implements $ProfileCopyWith<$Res> {
  factory _$ProfileCopyWith(_Profile value, $Res Function(_Profile) _then) = __$ProfileCopyWithImpl;
@override @useResult
$Res call({
 int? id,@JsonKey(name: 'namaKaryawan') String name,@JsonKey(name: 'liked') String liked,@JsonKey(name: 'alamatEmail') String email,@JsonKey(name: 'noHP') String? phone,@JsonKey(name: 'namaPerusahaan') String? perusahaan,@JsonKey(name: 'idperusahaan') String? perusahaanId,@JsonKey(name: 'alamatLongtitude') String? longitude,@JsonKey(name: 'alamatLatitude') String? latitude,@JsonKey(name: 'alamatLoc') String? address,@FullPathOptionalImageConverter()@JsonKey(name: 'foto') String photo,@JsonKey(name: 'joinDate') String? joinDate,@JsonKey(name: 'status') String? status,@JsonKey(name: 'fcmToken') String? fcmToken,@JsonKey(name: 'idkaryawan') String? idkaryawan,@JsonKey(name: 'gender') String? gender,@JsonKey(name: 'jabatan') String? jabatan
});




}
/// @nodoc
class __$ProfileCopyWithImpl<$Res>
    implements _$ProfileCopyWith<$Res> {
  __$ProfileCopyWithImpl(this._self, this._then);

  final _Profile _self;
  final $Res Function(_Profile) _then;

/// Create a copy of Profile
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = freezed,Object? name = null,Object? liked = null,Object? email = null,Object? phone = freezed,Object? perusahaan = freezed,Object? perusahaanId = freezed,Object? longitude = freezed,Object? latitude = freezed,Object? address = freezed,Object? photo = null,Object? joinDate = freezed,Object? status = freezed,Object? fcmToken = freezed,Object? idkaryawan = freezed,Object? gender = freezed,Object? jabatan = freezed,}) {
  return _then(_Profile(
id: freezed == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as int?,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,liked: null == liked ? _self.liked : liked // ignore: cast_nullable_to_non_nullable
as String,email: null == email ? _self.email : email // ignore: cast_nullable_to_non_nullable
as String,phone: freezed == phone ? _self.phone : phone // ignore: cast_nullable_to_non_nullable
as String?,perusahaan: freezed == perusahaan ? _self.perusahaan : perusahaan // ignore: cast_nullable_to_non_nullable
as String?,perusahaanId: freezed == perusahaanId ? _self.perusahaanId : perusahaanId // ignore: cast_nullable_to_non_nullable
as String?,longitude: freezed == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as String?,latitude: freezed == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as String?,address: freezed == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String?,photo: null == photo ? _self.photo : photo // ignore: cast_nullable_to_non_nullable
as String,joinDate: freezed == joinDate ? _self.joinDate : joinDate // ignore: cast_nullable_to_non_nullable
as String?,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,fcmToken: freezed == fcmToken ? _self.fcmToken : fcmToken // ignore: cast_nullable_to_non_nullable
as String?,idkaryawan: freezed == idkaryawan ? _self.idkaryawan : idkaryawan // ignore: cast_nullable_to_non_nullable
as String?,gender: freezed == gender ? _self.gender : gender // ignore: cast_nullable_to_non_nullable
as String?,jabatan: freezed == jabatan ? _self.jabatan : jabatan // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
