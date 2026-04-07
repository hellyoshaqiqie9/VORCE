// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'invitation.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$Invitation {

 String get receiver; String get sender;@JsonKey(name: 'idperusahaan') String get idPerusahaan; String get namaPerusahaan;
/// Create a copy of Invitation
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$InvitationCopyWith<Invitation> get copyWith => _$InvitationCopyWithImpl<Invitation>(this as Invitation, _$identity);

  /// Serializes this Invitation to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is Invitation&&(identical(other.receiver, receiver) || other.receiver == receiver)&&(identical(other.sender, sender) || other.sender == sender)&&(identical(other.idPerusahaan, idPerusahaan) || other.idPerusahaan == idPerusahaan)&&(identical(other.namaPerusahaan, namaPerusahaan) || other.namaPerusahaan == namaPerusahaan));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,receiver,sender,idPerusahaan,namaPerusahaan);

@override
String toString() {
  return 'Invitation(receiver: $receiver, sender: $sender, idPerusahaan: $idPerusahaan, namaPerusahaan: $namaPerusahaan)';
}


}

/// @nodoc
abstract mixin class $InvitationCopyWith<$Res>  {
  factory $InvitationCopyWith(Invitation value, $Res Function(Invitation) _then) = _$InvitationCopyWithImpl;
@useResult
$Res call({
 String receiver, String sender,@JsonKey(name: 'idperusahaan') String idPerusahaan, String namaPerusahaan
});




}
/// @nodoc
class _$InvitationCopyWithImpl<$Res>
    implements $InvitationCopyWith<$Res> {
  _$InvitationCopyWithImpl(this._self, this._then);

  final Invitation _self;
  final $Res Function(Invitation) _then;

/// Create a copy of Invitation
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? receiver = null,Object? sender = null,Object? idPerusahaan = null,Object? namaPerusahaan = null,}) {
  return _then(_self.copyWith(
receiver: null == receiver ? _self.receiver : receiver // ignore: cast_nullable_to_non_nullable
as String,sender: null == sender ? _self.sender : sender // ignore: cast_nullable_to_non_nullable
as String,idPerusahaan: null == idPerusahaan ? _self.idPerusahaan : idPerusahaan // ignore: cast_nullable_to_non_nullable
as String,namaPerusahaan: null == namaPerusahaan ? _self.namaPerusahaan : namaPerusahaan // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [Invitation].
extension InvitationPatterns on Invitation {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _Invitation value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _Invitation() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _Invitation value)  $default,){
final _that = this;
switch (_that) {
case _Invitation():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _Invitation value)?  $default,){
final _that = this;
switch (_that) {
case _Invitation() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function( String receiver,  String sender, @JsonKey(name: 'idperusahaan')  String idPerusahaan,  String namaPerusahaan)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _Invitation() when $default != null:
return $default(_that.receiver,_that.sender,_that.idPerusahaan,_that.namaPerusahaan);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function( String receiver,  String sender, @JsonKey(name: 'idperusahaan')  String idPerusahaan,  String namaPerusahaan)  $default,) {final _that = this;
switch (_that) {
case _Invitation():
return $default(_that.receiver,_that.sender,_that.idPerusahaan,_that.namaPerusahaan);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function( String receiver,  String sender, @JsonKey(name: 'idperusahaan')  String idPerusahaan,  String namaPerusahaan)?  $default,) {final _that = this;
switch (_that) {
case _Invitation() when $default != null:
return $default(_that.receiver,_that.sender,_that.idPerusahaan,_that.namaPerusahaan);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _Invitation implements Invitation {
  const _Invitation({required this.receiver, required this.sender, @JsonKey(name: 'idperusahaan') required this.idPerusahaan, required this.namaPerusahaan});
  factory _Invitation.fromJson(Map<String, dynamic> json) => _$InvitationFromJson(json);

@override final  String receiver;
@override final  String sender;
@override@JsonKey(name: 'idperusahaan') final  String idPerusahaan;
@override final  String namaPerusahaan;

/// Create a copy of Invitation
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$InvitationCopyWith<_Invitation> get copyWith => __$InvitationCopyWithImpl<_Invitation>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$InvitationToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _Invitation&&(identical(other.receiver, receiver) || other.receiver == receiver)&&(identical(other.sender, sender) || other.sender == sender)&&(identical(other.idPerusahaan, idPerusahaan) || other.idPerusahaan == idPerusahaan)&&(identical(other.namaPerusahaan, namaPerusahaan) || other.namaPerusahaan == namaPerusahaan));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,receiver,sender,idPerusahaan,namaPerusahaan);

@override
String toString() {
  return 'Invitation(receiver: $receiver, sender: $sender, idPerusahaan: $idPerusahaan, namaPerusahaan: $namaPerusahaan)';
}


}

/// @nodoc
abstract mixin class _$InvitationCopyWith<$Res> implements $InvitationCopyWith<$Res> {
  factory _$InvitationCopyWith(_Invitation value, $Res Function(_Invitation) _then) = __$InvitationCopyWithImpl;
@override @useResult
$Res call({
 String receiver, String sender,@JsonKey(name: 'idperusahaan') String idPerusahaan, String namaPerusahaan
});




}
/// @nodoc
class __$InvitationCopyWithImpl<$Res>
    implements _$InvitationCopyWith<$Res> {
  __$InvitationCopyWithImpl(this._self, this._then);

  final _Invitation _self;
  final $Res Function(_Invitation) _then;

/// Create a copy of Invitation
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? receiver = null,Object? sender = null,Object? idPerusahaan = null,Object? namaPerusahaan = null,}) {
  return _then(_Invitation(
receiver: null == receiver ? _self.receiver : receiver // ignore: cast_nullable_to_non_nullable
as String,sender: null == sender ? _self.sender : sender // ignore: cast_nullable_to_non_nullable
as String,idPerusahaan: null == idPerusahaan ? _self.idPerusahaan : idPerusahaan // ignore: cast_nullable_to_non_nullable
as String,namaPerusahaan: null == namaPerusahaan ? _self.namaPerusahaan : namaPerusahaan // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
