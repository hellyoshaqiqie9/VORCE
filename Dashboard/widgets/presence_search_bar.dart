part of '../views/presence.dart';

class _PresenceSearchBar extends StatelessWidget {
  const _PresenceSearchBar({
    required this.controller,
  });

  final TextEditingController controller;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.lightGrey,
        borderRadius: BorderRadius.circular(12),
      ),
      child: TextField(
        controller: controller,
        decoration: InputDecoration(
          hintText: "presence.search_hint".tr(), // TRANSLASI
          // IMPLEMENTASI GLOBAL FONT STYLE
          hintStyle: AppTheme.primaryTextStyle.copyWith(
            color: Colors.grey,
          ),
          suffixIcon: const Icon(Icons.search, color: Colors.grey),

          border: InputBorder.none,
          focusedBorder: InputBorder.none,
          enabledBorder: InputBorder.none,
          errorBorder: InputBorder.none,
          disabledBorder: InputBorder.none,

          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          isDense: true,
        ),
        // IMPLEMENTASI GLOBAL FONT STYLE
        style: AppTheme.primaryTextStyle,
      ),
    );
  }
}