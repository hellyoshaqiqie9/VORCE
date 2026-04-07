// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'keterangan.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Keterangan {

@JsonKey(name: 'NamaPerusahaan') String get namaPerusahaan;@JsonKey(name: 'Keterangan') String get keterangan;
/// Create a copy of Keterangan
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$KeteranganCopyWith<Keterangan> get copyWith => _$KeteranganCopyWithImpl<Keterangan>(this as Keterangan, _$identity);

  /// Serializes this Keterangan to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Keterangan&&(identical(other.namaPerusahaan, namaPerusahaan) || other.namaPerusahaan == namaPerusahaan)&&(identical(other.keterangan, keterangan) || other.keterangan == keterangan));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,namaPerusahaan,keterangan);

@override
String toString() {
  return 'Keterangan(namaPerusahaan: $namaPerusahaan, keterangan: $keterangan)';
}


}

/// @nodoc
abstract mixin class $KeteranganCopyWith<$Res>  {
  factory $KeteranganCopyWith(Keterangan value, $Res Function(Keterangan) _then) = _$KeteranganCopyWithImpl;
@useResult
$Res call({
@JsonKey(name: 'NamaPerusahaan') String namaPerusahaan,@JsonKey(name: 'Keterangan') String keterangan
});




}
/// @nodoc
class _$KeteranganCopyWithImpl<$Res>
    implements $KeteranganCopyWith<$Res> {
  _$KeteranganCopyWithImpl(this._self, this._then);

  final Keterangan _self;
  final $Res Function(Keterangan) _then;

/// Create a copy of Keterangan
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? namaPerusahaan = null,Object? keterangan = null,}) {
  return _then(_self.copyWith(
namaPerusahaan: null == namaPerusahaan ? _self.namaPerusahaan : namaPerusahaan // ignore: cast_nullable_to_non_nullable
as String,keterangan: null == keterangan ? _self.keterangan : keterangan // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [Keterangan].
extension KeteranganPatterns on Keterangan {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Keterangan value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Keterangan() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Keterangan value)  $default,){
final _that = this;
switch (_that) {
case _Keterangan():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Keterangan value)?  $default,){
final _that = this;
switch (_that) {
case _Keterangan() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@JsonKey(name: 'NamaPerusahaan')  String namaPerusahaan, @JsonKey(name: 'Keterangan')  String keterangan)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Keterangan() when $default != null:
return $default(_that.namaPerusahaan,_that.keterangan);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@JsonKey(name: 'NamaPerusahaan')  String namaPerusahaan, @JsonKey(name: 'Keterangan')  String keterangan)  $default,) {final _that = this;
switch (_that) {
case _Keterangan():
return $default(_that.namaPerusahaan,_that.keterangan);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@JsonKey(name: 'NamaPerusahaan')  String namaPerusahaan, @JsonKey(name: 'Keterangan')  String keterangan)?  $default,) {final _that = this;
switch (_that) {
case _Keterangan() when $default != null:
return $default(_that.namaPerusahaan,_that.keterangan);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Keterangan implements Keterangan {
  const _Keterangan({@JsonKey(name: 'NamaPerusahaan') required this.namaPerusahaan, @JsonKey(name: 'Keterangan') required this.keterangan});
  factory _Keterangan.fromJson(Map<String, dynamic> json) => _$KeteranganFromJson(json);

@override@JsonKey(name: 'NamaPerusahaan') final  String namaPerusahaan;
@override@JsonKey(name: 'Keterangan') final  String keterangan;

/// Create a copy of Keterangan
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$KeteranganCopyWith<_Keterangan> get copyWith => __$KeteranganCopyWithImpl<_Keterangan>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$KeteranganToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Keterangan&&(identical(other.namaPerusahaan, namaPerusahaan) || other.namaPerusahaan == namaPerusahaan)&&(identical(other.keterangan, keterangan) || other.keterangan == keterangan));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,namaPerusahaan,keterangan);

@override
String toString() {
  return 'Keterangan(namaPerusahaan: $namaPerusahaan, keterangan: $keterangan)';
}


}

/// @nodoc
abstract mixin class _$KeteranganCopyWith<$Res> implements $KeteranganCopyWith<$Res> {
  factory _$KeteranganCopyWith(_Keterangan value, $Res Function(_Keterangan) _then) = __$KeteranganCopyWithImpl;
@override @useResult
$Res call({
@JsonKey(name: 'NamaPerusahaan') String namaPerusahaan,@JsonKey(name: 'Keterangan') String keterangan
});




}
/// @nodoc
class __$KeteranganCopyWithImpl<$Res>
    implements _$KeteranganCopyWith<$Res> {
  __$KeteranganCopyWithImpl(this._self, this._then);

  final _Keterangan _self;
  final $Res Function(_Keterangan) _then;

/// Create a copy of Keterangan
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? namaPerusahaan = null,Object? keterangan = null,}) {
  return _then(_Keterangan(
namaPerusahaan: null == namaPerusahaan ? _self.namaPerusahaan : namaPerusahaan // ignore: cast_nullable_to_non_nullable
as String,keterangan: null == keterangan ? _self.keterangan : keterangan // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
