// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'company.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Company {

@JsonKey(name: 'idperusahaan') String get id;@JsonKey(name: 'namaPerusahaan') String get name;@JsonKey(name: 'logoPerusahaan') String? get logo;@JsonKey(name: 'alamatLoc') String get alamat; String? get keterangan;@JsonKey(name: 'alamatLongtitude') String get longitude;@JsonKey(name: 'alamatLatitude') String get latitude;@JsonKey(name: 'totalLike') int get like;// --- UPDATED: Mapping 'total' dari JSON ke totalEmployee ---
@JsonKey(name: 'total') int get totalEmployee;// --- NEW: Field untuk Total Storage (dalam MB) ---
// Pastikan API/Firebase mengirim field 'totalStorage' atau Anda hitung manual di datasource
@JsonKey(name: 'totalStorage') double get totalStorage;@JsonKey(name: 'status') String? get status;@JsonKey(name: 'noTelp') String? get noTelp;@JsonKey(name: 'noWA') String? get noWA;
/// Create a copy of Company
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CompanyCopyWith<Company> get copyWith => _$CompanyCopyWithImpl<Company>(this as Company, _$identity);

  /// Serializes this Company to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Company&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.logo, logo) || other.logo == logo)&&(identical(other.alamat, alamat) || other.alamat == alamat)&&(identical(other.keterangan, keterangan) || other.keterangan == keterangan)&&(identical(other.longitude, longitude) || other.longitude == longitude)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.like, like) || other.like == like)&&(identical(other.totalEmployee, totalEmployee) || other.totalEmployee == totalEmployee)&&(identical(other.totalStorage, totalStorage) || other.totalStorage == totalStorage)&&(identical(other.status, status) || other.status == status)&&(identical(other.noTelp, noTelp) || other.noTelp == noTelp)&&(identical(other.noWA, noWA) || other.noWA == noWA));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,logo,alamat,keterangan,longitude,latitude,like,totalEmployee,totalStorage,status,noTelp,noWA);

@override
String toString() {
  return 'Company(id: $id, name: $name, logo: $logo, alamat: $alamat, keterangan: $keterangan, longitude: $longitude, latitude: $latitude, like: $like, totalEmployee: $totalEmployee, totalStorage: $totalStorage, status: $status, noTelp: $noTelp, noWA: $noWA)';
}


}

/// @nodoc
abstract mixin class $CompanyCopyWith<$Res>  {
  factory $CompanyCopyWith(Company value, $Res Function(Company) _then) = _$CompanyCopyWithImpl;
@useResult
$Res call({
@JsonKey(name: 'idperusahaan') String id,@JsonKey(name: 'namaPerusahaan') String name,@JsonKey(name: 'logoPerusahaan') String? logo,@JsonKey(name: 'alamatLoc') String alamat, String? keterangan,@JsonKey(name: 'alamatLongtitude') String longitude,@JsonKey(name: 'alamatLatitude') String latitude,@JsonKey(name: 'totalLike') int like,@JsonKey(name: 'total') int totalEmployee,@JsonKey(name: 'totalStorage') double totalStorage,@JsonKey(name: 'status') String? status,@JsonKey(name: 'noTelp') String? noTelp,@JsonKey(name: 'noWA') String? noWA
});




}
/// @nodoc
class _$CompanyCopyWithImpl<$Res>
    implements $CompanyCopyWith<$Res> {
  _$CompanyCopyWithImpl(this._self, this._then);

  final Company _self;
  final $Res Function(Company) _then;

/// Create a copy of Company
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? name = null,Object? logo = freezed,Object? alamat = null,Object? keterangan = freezed,Object? longitude = null,Object? latitude = null,Object? like = null,Object? totalEmployee = null,Object? totalStorage = null,Object? status = freezed,Object? noTelp = freezed,Object? noWA = freezed,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,logo: freezed == logo ? _self.logo : logo // ignore: cast_nullable_to_non_nullable
as String?,alamat: null == alamat ? _self.alamat : alamat // ignore: cast_nullable_to_non_nullable
as String,keterangan: freezed == keterangan ? _self.keterangan : keterangan // ignore: cast_nullable_to_non_nullable
as String?,longitude: null == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as String,latitude: null == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as String,like: null == like ? _self.like : like // ignore: cast_nullable_to_non_nullable
as int,totalEmployee: null == totalEmployee ? _self.totalEmployee : totalEmployee // ignore: cast_nullable_to_non_nullable
as int,totalStorage: null == totalStorage ? _self.totalStorage : totalStorage // ignore: cast_nullable_to_non_nullable
as double,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,noTelp: freezed == noTelp ? _self.noTelp : noTelp // ignore: cast_nullable_to_non_nullable
as String?,noWA: freezed == noWA ? _self.noWA : noWA // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}

}


/// Adds pattern-matching-related methods to [Company].
extension CompanyPatterns on Company {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Company value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Company() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Company value)  $default,){
final _that = this;
switch (_that) {
case _Company():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Company value)?  $default,){
final _that = this;
switch (_that) {
case _Company() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@JsonKey(name: 'idperusahaan')  String id, @JsonKey(name: 'namaPerusahaan')  String name, @JsonKey(name: 'logoPerusahaan')  String? logo, @JsonKey(name: 'alamatLoc')  String alamat,  String? keterangan, @JsonKey(name: 'alamatLongtitude')  String longitude, @JsonKey(name: 'alamatLatitude')  String latitude, @JsonKey(name: 'totalLike')  int like, @JsonKey(name: 'total')  int totalEmployee, @JsonKey(name: 'totalStorage')  double totalStorage, @JsonKey(name: 'status')  String? status, @JsonKey(name: 'noTelp')  String? noTelp, @JsonKey(name: 'noWA')  String? noWA)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Company() when $default != null:
return $default(_that.id,_that.name,_that.logo,_that.alamat,_that.keterangan,_that.longitude,_that.latitude,_that.like,_that.totalEmployee,_that.totalStorage,_that.status,_that.noTelp,_that.noWA);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@JsonKey(name: 'idperusahaan')  String id, @JsonKey(name: 'namaPerusahaan')  String name, @JsonKey(name: 'logoPerusahaan')  String? logo, @JsonKey(name: 'alamatLoc')  String alamat,  String? keterangan, @JsonKey(name: 'alamatLongtitude')  String longitude, @JsonKey(name: 'alamatLatitude')  String latitude, @JsonKey(name: 'totalLike')  int like, @JsonKey(name: 'total')  int totalEmployee, @JsonKey(name: 'totalStorage')  double totalStorage, @JsonKey(name: 'status')  String? status, @JsonKey(name: 'noTelp')  String? noTelp, @JsonKey(name: 'noWA')  String? noWA)  $default,) {final _that = this;
switch (_that) {
case _Company():
return $default(_that.id,_that.name,_that.logo,_that.alamat,_that.keterangan,_that.longitude,_that.latitude,_that.like,_that.totalEmployee,_that.totalStorage,_that.status,_that.noTelp,_that.noWA);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@JsonKey(name: 'idperusahaan')  String id, @JsonKey(name: 'namaPerusahaan')  String name, @JsonKey(name: 'logoPerusahaan')  String? logo, @JsonKey(name: 'alamatLoc')  String alamat,  String? keterangan, @JsonKey(name: 'alamatLongtitude')  String longitude, @JsonKey(name: 'alamatLatitude')  String latitude, @JsonKey(name: 'totalLike')  int like, @JsonKey(name: 'total')  int totalEmployee, @JsonKey(name: 'totalStorage')  double totalStorage, @JsonKey(name: 'status')  String? status, @JsonKey(name: 'noTelp')  String? noTelp, @JsonKey(name: 'noWA')  String? noWA)?  $default,) {final _that = this;
switch (_that) {
case _Company() when $default != null:
return $default(_that.id,_that.name,_that.logo,_that.alamat,_that.keterangan,_that.longitude,_that.latitude,_that.like,_that.totalEmployee,_that.totalStorage,_that.status,_that.noTelp,_that.noWA);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Company implements Company {
  const _Company({@JsonKey(name: 'idperusahaan') this.id = 'HORA-001', @JsonKey(name: 'namaPerusahaan') this.name = 'PT HORA', @JsonKey(name: 'logoPerusahaan') this.logo, @JsonKey(name: 'alamatLoc') this.alamat = 'Jl. Budiluhur No.47 Medan, Indonesia', this.keterangan, @JsonKey(name: 'alamatLongtitude') this.longitude = '98.6388869', @JsonKey(name: 'alamatLatitude') this.latitude = '3.5955809', @JsonKey(name: 'totalLike') this.like = 0, @JsonKey(name: 'total') this.totalEmployee = 0, @JsonKey(name: 'totalStorage') this.totalStorage = 0.0, @JsonKey(name: 'status') this.status, @JsonKey(name: 'noTelp') this.noTelp, @JsonKey(name: 'noWA') this.noWA});
  factory _Company.fromJson(Map<String, dynamic> json) => _$CompanyFromJson(json);

@override@JsonKey(name: 'idperusahaan') final  String id;
@override@JsonKey(name: 'namaPerusahaan') final  String name;
@override@JsonKey(name: 'logoPerusahaan') final  String? logo;
@override@JsonKey(name: 'alamatLoc') final  String alamat;
@override final  String? keterangan;
@override@JsonKey(name: 'alamatLongtitude') final  String longitude;
@override@JsonKey(name: 'alamatLatitude') final  String latitude;
@override@JsonKey(name: 'totalLike') final  int like;
// --- UPDATED: Mapping 'total' dari JSON ke totalEmployee ---
@override@JsonKey(name: 'total') final  int totalEmployee;
// --- NEW: Field untuk Total Storage (dalam MB) ---
// Pastikan API/Firebase mengirim field 'totalStorage' atau Anda hitung manual di datasource
@override@JsonKey(name: 'totalStorage') final  double totalStorage;
@override@JsonKey(name: 'status') final  String? status;
@override@JsonKey(name: 'noTelp') final  String? noTelp;
@override@JsonKey(name: 'noWA') final  String? noWA;

/// Create a copy of Company
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CompanyCopyWith<_Company> get copyWith => __$CompanyCopyWithImpl<_Company>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CompanyToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Company&&(identical(other.id, id) || other.id == id)&&(identical(other.name, name) || other.name == name)&&(identical(other.logo, logo) || other.logo == logo)&&(identical(other.alamat, alamat) || other.alamat == alamat)&&(identical(other.keterangan, keterangan) || other.keterangan == keterangan)&&(identical(other.longitude, longitude) || other.longitude == longitude)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.like, like) || other.like == like)&&(identical(other.totalEmployee, totalEmployee) || other.totalEmployee == totalEmployee)&&(identical(other.totalStorage, totalStorage) || other.totalStorage == totalStorage)&&(identical(other.status, status) || other.status == status)&&(identical(other.noTelp, noTelp) || other.noTelp == noTelp)&&(identical(other.noWA, noWA) || other.noWA == noWA));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,name,logo,alamat,keterangan,longitude,latitude,like,totalEmployee,totalStorage,status,noTelp,noWA);

@override
String toString() {
  return 'Company(id: $id, name: $name, logo: $logo, alamat: $alamat, keterangan: $keterangan, longitude: $longitude, latitude: $latitude, like: $like, totalEmployee: $totalEmployee, totalStorage: $totalStorage, status: $status, noTelp: $noTelp, noWA: $noWA)';
}


}

/// @nodoc
abstract mixin class _$CompanyCopyWith<$Res> implements $CompanyCopyWith<$Res> {
  factory _$CompanyCopyWith(_Company value, $Res Function(_Company) _then) = __$CompanyCopyWithImpl;
@override @useResult
$Res call({
@JsonKey(name: 'idperusahaan') String id,@JsonKey(name: 'namaPerusahaan') String name,@JsonKey(name: 'logoPerusahaan') String? logo,@JsonKey(name: 'alamatLoc') String alamat, String? keterangan,@JsonKey(name: 'alamatLongtitude') String longitude,@JsonKey(name: 'alamatLatitude') String latitude,@JsonKey(name: 'totalLike') int like,@JsonKey(name: 'total') int totalEmployee,@JsonKey(name: 'totalStorage') double totalStorage,@JsonKey(name: 'status') String? status,@JsonKey(name: 'noTelp') String? noTelp,@JsonKey(name: 'noWA') String? noWA
});




}
/// @nodoc
class __$CompanyCopyWithImpl<$Res>
    implements _$CompanyCopyWith<$Res> {
  __$CompanyCopyWithImpl(this._self, this._then);

  final _Company _self;
  final $Res Function(_Company) _then;

/// Create a copy of Company
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? name = null,Object? logo = freezed,Object? alamat = null,Object? keterangan = freezed,Object? longitude = null,Object? latitude = null,Object? like = null,Object? totalEmployee = null,Object? totalStorage = null,Object? status = freezed,Object? noTelp = freezed,Object? noWA = freezed,}) {
  return _then(_Company(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,name: null == name ? _self.name : name // ignore: cast_nullable_to_non_nullable
as String,logo: freezed == logo ? _self.logo : logo // ignore: cast_nullable_to_non_nullable
as String?,alamat: null == alamat ? _self.alamat : alamat // ignore: cast_nullable_to_non_nullable
as String,keterangan: freezed == keterangan ? _self.keterangan : keterangan // ignore: cast_nullable_to_non_nullable
as String?,longitude: null == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as String,latitude: null == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as String,like: null == like ? _self.like : like // ignore: cast_nullable_to_non_nullable
as int,totalEmployee: null == totalEmployee ? _self.totalEmployee : totalEmployee // ignore: cast_nullable_to_non_nullable
as int,totalStorage: null == totalStorage ? _self.totalStorage : totalStorage // ignore: cast_nullable_to_non_nullable
as double,status: freezed == status ? _self.status : status // ignore: cast_nullable_to_non_nullable
as String?,noTelp: freezed == noTelp ? _self.noTelp : noTelp // ignore: cast_nullable_to_non_nullable
as String?,noWA: freezed == noWA ? _self.noWA : noWA // ignore: cast_nullable_to_non_nullable
as String?,
  ));
}


}

// dart format on
