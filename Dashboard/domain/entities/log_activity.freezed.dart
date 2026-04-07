// GENERATED CODE - DO NOT MODIFY BY HAND
// coverage:ignore-file
// ignore_for_file: type=lint
// ignore_for_file: unused_element, deprecated_member_use, deprecated_member_use_from_same_package, use_function_type_syntax_for_parameters, unnecessary_const, avoid_init_to_null, invalid_override_different_default_values_named, prefer_expression_function_bodies, annotate_overrides, invalid_annotation_target, unnecessary_question_mark

part of 'log_activity.dart';

// **************************************************************************
// FreezedGenerator
// **************************************************************************

// dart format off
T _$identity<T>(T value) => value;

/// @nodoc
mixin _$LogActivity {

@JsonKey(name: "id") String get id;@JsonKey(name: "actorName") String get actorName;@JsonKey(name: "actorEmail") String get actorEmail;@JsonKey(name: "action") String get action;@JsonKey(name: "description") String get description;@JsonKey(name: "target") String get target;@JsonKey(name: "createdAt") String get createdAt;
/// Create a copy of LogActivity
/// with the given fields replaced by the non-null parameter values.
@JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
$LogActivityCopyWith<LogActivity> get copyWith => _$LogActivityCopyWithImpl<LogActivity>(this as LogActivity, _$identity);

  /// Serializes this LogActivity to a JSON map.
  Map<String, dynamic> toJson();


@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is LogActivity&&(identical(other.id, id) || other.id == id)&&(identical(other.actorName, actorName) || other.actorName == actorName)&&(identical(other.actorEmail, actorEmail) || other.actorEmail == actorEmail)&&(identical(other.action, action) || other.action == action)&&(identical(other.description, description) || other.description == description)&&(identical(other.target, target) || other.target == target)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,actorName,actorEmail,action,description,target,createdAt);

@override
String toString() {
  return 'LogActivity(id: $id, actorName: $actorName, actorEmail: $actorEmail, action: $action, description: $description, target: $target, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class $LogActivityCopyWith<$Res>  {
  factory $LogActivityCopyWith(LogActivity value, $Res Function(LogActivity) _then) = _$LogActivityCopyWithImpl;
@useResult
$Res call({
@JsonKey(name: "id") String id,@JsonKey(name: "actorName") String actorName,@JsonKey(name: "actorEmail") String actorEmail,@JsonKey(name: "action") String action,@JsonKey(name: "description") String description,@JsonKey(name: "target") String target,@JsonKey(name: "createdAt") String createdAt
});




}
/// @nodoc
class _$LogActivityCopyWithImpl<$Res>
    implements $LogActivityCopyWith<$Res> {
  _$LogActivityCopyWithImpl(this._self, this._then);

  final LogActivity _self;
  final $Res Function(LogActivity) _then;

/// Create a copy of LogActivity
/// with the given fields replaced by the non-null parameter values.
@pragma('vm:prefer-inline') @override $Res call({Object? id = null,Object? actorName = null,Object? actorEmail = null,Object? action = null,Object? description = null,Object? target = null,Object? createdAt = null,}) {
  return _then(_self.copyWith(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,actorName: null == actorName ? _self.actorName : actorName // ignore: cast_nullable_to_non_nullable
as String,actorEmail: null == actorEmail ? _self.actorEmail : actorEmail // ignore: cast_nullable_to_non_nullable
as String,action: null == action ? _self.action : action // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,target: null == target ? _self.target : target // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}

}


/// Adds pattern-matching-related methods to [LogActivity].
extension LogActivityPatterns on LogActivity {
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

@optionalTypeArgs TResult maybeMap<TResult extends Object?>(TResult Function( _LogActivity value)?  $default,{required TResult orElse(),}){
final _that = this;
switch (_that) {
case _LogActivity() when $default != null:
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

@optionalTypeArgs TResult map<TResult extends Object?>(TResult Function( _LogActivity value)  $default,){
final _that = this;
switch (_that) {
case _LogActivity():
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

@optionalTypeArgs TResult? mapOrNull<TResult extends Object?>(TResult? Function( _LogActivity value)?  $default,){
final _that = this;
switch (_that) {
case _LogActivity() when $default != null:
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

@optionalTypeArgs TResult maybeWhen<TResult extends Object?>(TResult Function(@JsonKey(name: "id")  String id, @JsonKey(name: "actorName")  String actorName, @JsonKey(name: "actorEmail")  String actorEmail, @JsonKey(name: "action")  String action, @JsonKey(name: "description")  String description, @JsonKey(name: "target")  String target, @JsonKey(name: "createdAt")  String createdAt)?  $default,{required TResult orElse(),}) {final _that = this;
switch (_that) {
case _LogActivity() when $default != null:
return $default(_that.id,_that.actorName,_that.actorEmail,_that.action,_that.description,_that.target,_that.createdAt);case _:
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

@optionalTypeArgs TResult when<TResult extends Object?>(TResult Function(@JsonKey(name: "id")  String id, @JsonKey(name: "actorName")  String actorName, @JsonKey(name: "actorEmail")  String actorEmail, @JsonKey(name: "action")  String action, @JsonKey(name: "description")  String description, @JsonKey(name: "target")  String target, @JsonKey(name: "createdAt")  String createdAt)  $default,) {final _that = this;
switch (_that) {
case _LogActivity():
return $default(_that.id,_that.actorName,_that.actorEmail,_that.action,_that.description,_that.target,_that.createdAt);case _:
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

@optionalTypeArgs TResult? whenOrNull<TResult extends Object?>(TResult? Function(@JsonKey(name: "id")  String id, @JsonKey(name: "actorName")  String actorName, @JsonKey(name: "actorEmail")  String actorEmail, @JsonKey(name: "action")  String action, @JsonKey(name: "description")  String description, @JsonKey(name: "target")  String target, @JsonKey(name: "createdAt")  String createdAt)?  $default,) {final _that = this;
switch (_that) {
case _LogActivity() when $default != null:
return $default(_that.id,_that.actorName,_that.actorEmail,_that.action,_that.description,_that.target,_that.createdAt);case _:
  return null;

}
}

}

/// @nodoc
@JsonSerializable()

class _LogActivity implements LogActivity {
  const _LogActivity({@JsonKey(name: "id") required this.id, @JsonKey(name: "actorName") required this.actorName, @JsonKey(name: "actorEmail") required this.actorEmail, @JsonKey(name: "action") required this.action, @JsonKey(name: "description") required this.description, @JsonKey(name: "target") required this.target, @JsonKey(name: "createdAt") required this.createdAt});
  factory _LogActivity.fromJson(Map<String, dynamic> json) => _$LogActivityFromJson(json);

@override@JsonKey(name: "id") final  String id;
@override@JsonKey(name: "actorName") final  String actorName;
@override@JsonKey(name: "actorEmail") final  String actorEmail;
@override@JsonKey(name: "action") final  String action;
@override@JsonKey(name: "description") final  String description;
@override@JsonKey(name: "target") final  String target;
@override@JsonKey(name: "createdAt") final  String createdAt;

/// Create a copy of LogActivity
/// with the given fields replaced by the non-null parameter values.
@override @JsonKey(includeFromJson: false, includeToJson: false)
@pragma('vm:prefer-inline')
_$LogActivityCopyWith<_LogActivity> get copyWith => __$LogActivityCopyWithImpl<_LogActivity>(this, _$identity);

@override
Map<String, dynamic> toJson() {
  return _$LogActivityToJson(this, );
}

@override
bool operator ==(Object other) {
  return identical(this, other) || (other.runtimeType == runtimeType&&other is _LogActivity&&(identical(other.id, id) || other.id == id)&&(identical(other.actorName, actorName) || other.actorName == actorName)&&(identical(other.actorEmail, actorEmail) || other.actorEmail == actorEmail)&&(identical(other.action, action) || other.action == action)&&(identical(other.description, description) || other.description == description)&&(identical(other.target, target) || other.target == target)&&(identical(other.createdAt, createdAt) || other.createdAt == createdAt));
}

@JsonKey(includeFromJson: false, includeToJson: false)
@override
int get hashCode => Object.hash(runtimeType,id,actorName,actorEmail,action,description,target,createdAt);

@override
String toString() {
  return 'LogActivity(id: $id, actorName: $actorName, actorEmail: $actorEmail, action: $action, description: $description, target: $target, createdAt: $createdAt)';
}


}

/// @nodoc
abstract mixin class _$LogActivityCopyWith<$Res> implements $LogActivityCopyWith<$Res> {
  factory _$LogActivityCopyWith(_LogActivity value, $Res Function(_LogActivity) _then) = __$LogActivityCopyWithImpl;
@override @useResult
$Res call({
@JsonKey(name: "id") String id,@JsonKey(name: "actorName") String actorName,@JsonKey(name: "actorEmail") String actorEmail,@JsonKey(name: "action") String action,@JsonKey(name: "description") String description,@JsonKey(name: "target") String target,@JsonKey(name: "createdAt") String createdAt
});




}
/// @nodoc
class __$LogActivityCopyWithImpl<$Res>
    implements _$LogActivityCopyWith<$Res> {
  __$LogActivityCopyWithImpl(this._self, this._then);

  final _LogActivity _self;
  final $Res Function(_LogActivity) _then;

/// Create a copy of LogActivity
/// with the given fields replaced by the non-null parameter values.
@override @pragma('vm:prefer-inline') $Res call({Object? id = null,Object? actorName = null,Object? actorEmail = null,Object? action = null,Object? description = null,Object? target = null,Object? createdAt = null,}) {
  return _then(_LogActivity(
id: null == id ? _self.id : id // ignore: cast_nullable_to_non_nullable
as String,actorName: null == actorName ? _self.actorName : actorName // ignore: cast_nullable_to_non_nullable
as String,actorEmail: null == actorEmail ? _self.actorEmail : actorEmail // ignore: cast_nullable_to_non_nullable
as String,action: null == action ? _self.action : action // ignore: cast_nullable_to_non_nullable
as String,description: null == description ? _self.description : description // ignore: cast_nullable_to_non_nullable
as String,target: null == target ? _self.target : target // ignore: cast_nullable_to_non_nullable
as String,createdAt: null == createdAt ? _self.createdAt : createdAt // ignore: cast_nullable_to_non_nullable
as String,
  ));
}


}

// dart format on
