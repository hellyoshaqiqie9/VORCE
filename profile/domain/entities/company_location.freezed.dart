// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'company_location.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$CompanyLocation {

@JsonKey(name: 'NamaPerusahaan') String get namaPerusahaan;@JsonKey(name: 'AlamatLatitude') String get latitude;@JsonKey(name: 'AlamatLongtitude') String get longitude;@JsonKey(name: 'AlamatLoc') String get address;
/// Create a copy of CompanyLocation
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$CompanyLocationCopyWith<CompanyLocation> get copyWith => _$CompanyLocationCopyWithImpl<CompanyLocation>(this as CompanyLocation, _$identity);

  /// Serializes this CompanyLocation to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is CompanyLocation&&(identical(other.namaPerusahaan, namaPerusahaan) || other.namaPerusahaan == namaPerusahaan)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.longitude, longitude) || other.longitude == longitude)&&(identical(other.address, address) || other.address == address));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,namaPerusahaan,latitude,longitude,address);

@override
String toString() {
  return 'CompanyLocation(namaPerusahaan: $namaPerusahaan, latitude: $latitude, longitude: $longitude, address: $address)';
}


}

/// @nodoc
abstract mixin class $CompanyLocationCopyWith<$Res>  {
  factory $CompanyLocationCopyWith(CompanyLocation value, $Res Function(CompanyLocation) _then) = _$CompanyLocationCopyWithImpl;
@useResult
$Res call({
@JsonKey(name: 'NamaPerusahaan') String namaPerusahaan,@JsonKey(name: 'AlamatLatitude') String latitude,@JsonKey(name: 'AlamatLongtitude') String longitude,@JsonKey(name: 'AlamatLoc') String address
});




}
/// @nodoc
class _$CompanyLocationCopyWithImpl<$Res>
    implements $CompanyLocationCopyWith<$Res> {
  _$CompanyLocationCopyWithImpl(this._self, this._then);

  final CompanyLocation _self;
  final $Res Function(CompanyLocation) _then;

/// Create a copy of CompanyLocation
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? namaPerusahaan = null,Object? latitude = null,Object? longitude = null,Object? address = null,}) {
  return _then(_self.copyWith(
namaPerusahaan: null == namaPerusahaan ? _self.namaPerusahaan : namaPerusahaan // ignore: cast_nullable_to_non_nullable
as String,latitude: null == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as String,longitude: null == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as String,address: null == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [CompanyLocation].
extension CompanyLocationPatterns on CompanyLocation {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _CompanyLocation value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _CompanyLocation() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _CompanyLocation value)  $default,){
final _that = this;
switch (_that) {
case _CompanyLocation():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _CompanyLocation value)?  $default,){
final _that = this;
switch (_that) {
case _CompanyLocation() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@JsonKey(name: 'NamaPerusahaan')  String namaPerusahaan, @JsonKey(name: 'AlamatLatitude')  String latitude, @JsonKey(name: 'AlamatLongtitude')  String longitude, @JsonKey(name: 'AlamatLoc')  String address)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _CompanyLocation() when $default != null:
return $default(_that.namaPerusahaan,_that.latitude,_that.longitude,_that.address);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@JsonKey(name: 'NamaPerusahaan')  String namaPerusahaan, @JsonKey(name: 'AlamatLatitude')  String latitude, @JsonKey(name: 'AlamatLongtitude')  String longitude, @JsonKey(name: 'AlamatLoc')  String address)  $default,) {final _that = this;
switch (_that) {
case _CompanyLocation():
return $default(_that.namaPerusahaan,_that.latitude,_that.longitude,_that.address);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@JsonKey(name: 'NamaPerusahaan')  String namaPerusahaan, @JsonKey(name: 'AlamatLatitude')  String latitude, @JsonKey(name: 'AlamatLongtitude')  String longitude, @JsonKey(name: 'AlamatLoc')  String address)?  $default,) {final _that = this;
switch (_that) {
case _CompanyLocation() when $default != null:
return $default(_that.namaPerusahaan,_that.latitude,_that.longitude,_that.address);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _CompanyLocation implements CompanyLocation {
  const _CompanyLocation({@JsonKey(name: 'NamaPerusahaan') required this.namaPerusahaan, @JsonKey(name: 'AlamatLatitude') required this.latitude, @JsonKey(name: 'AlamatLongtitude') required this.longitude, @JsonKey(name: 'AlamatLoc') required this.address});
  factory _CompanyLocation.fromJson(Map<String, dynamic> json) => _$CompanyLocationFromJson(json);

@override@JsonKey(name: 'NamaPerusahaan') final  String namaPerusahaan;
@override@JsonKey(name: 'AlamatLatitude') final  String latitude;
@override@JsonKey(name: 'AlamatLongtitude') final  String longitude;
@override@JsonKey(name: 'AlamatLoc') final  String address;

/// Create a copy of CompanyLocation
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$CompanyLocationCopyWith<_CompanyLocation> get copyWith => __$CompanyLocationCopyWithImpl<_CompanyLocation>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$CompanyLocationToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _CompanyLocation&&(identical(other.namaPerusahaan, namaPerusahaan) || other.namaPerusahaan == namaPerusahaan)&&(identical(other.latitude, latitude) || other.latitude == latitude)&&(identical(other.longitude, longitude) || other.longitude == longitude)&&(identical(other.address, address) || other.address == address));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,namaPerusahaan,latitude,longitude,address);

@override
String toString() {
  return 'CompanyLocation(namaPerusahaan: $namaPerusahaan, latitude: $latitude, longitude: $longitude, address: $address)';
}


}

/// @nodoc
abstract mixin class _$CompanyLocationCopyWith<$Res> implements $CompanyLocationCopyWith<$Res> {
  factory _$CompanyLocationCopyWith(_CompanyLocation value, $Res Function(_CompanyLocation) _then) = __$CompanyLocationCopyWithImpl;
@override @useResult
$Res call({
@JsonKey(name: 'NamaPerusahaan') String namaPerusahaan,@JsonKey(name: 'AlamatLatitude') String latitude,@JsonKey(name: 'AlamatLongtitude') String longitude,@JsonKey(name: 'AlamatLoc') String address
});




}
/// @nodoc
class __$CompanyLocationCopyWithImpl<$Res>
    implements _$CompanyLocationCopyWith<$Res> {
  __$CompanyLocationCopyWithImpl(this._self, this._then);

  final _CompanyLocation _self;
  final $Res Function(_CompanyLocation) _then;

/// Create a copy of CompanyLocation
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? namaPerusahaan = null,Object? latitude = null,Object? longitude = null,Object? address = null,}) {
  return _then(_CompanyLocation(
namaPerusahaan: null == namaPerusahaan ? _self.namaPerusahaan : namaPerusahaan // ignore: cast_nullable_to_non_nullable
as String,latitude: null == latitude ? _self.latitude : latitude // ignore: cast_nullable_to_non_nullable
as String,longitude: null == longitude ? _self.longitude : longitude // ignore: cast_nullable_to_non_nullable
as String,address: null == address ? _self.address : address // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
