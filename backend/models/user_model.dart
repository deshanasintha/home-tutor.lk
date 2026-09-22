import 'package:cloud_firestore/cloud_firestore.dart';

class UserModel {
  final String uid;
  final String fullName;
  final String email;
  final String phone;
  final String role; // 'tutor', 'parent', 'admin'
  final String district;
  final List<String>? subjects; // Tutor සඳහා පමණි
  final String? hourlyRate; // Tutor සඳහා පමණි
  final DateTime? createdAt;

  UserModel({
    required this.uid,
    required this.fullName,
    required this.email,
    required this.phone,
    required this.role,
    required this.district,
    this.subjects,
    this.hourlyRate,
    this.createdAt,
  });

  // Map එකක් බවට හැරවීම (Firestore එකට Save කිරීමට)
  Map<String, dynamic> toMap() {
    Map<String, dynamic> map = {
      'uid': uid,
      'fullName': fullName,
      'email': email,
      'phone': phone,
      'role': role,
      'district': district,
      'createdAt': createdAt != null ? Timestamp.fromDate(createdAt!) : FieldValue.serverTimestamp(),
    };

    if (role == 'tutor') {
      map['subjects'] = subjects ?? [];
      map['hourlyRate'] = hourlyRate ?? '';
    }

    return map;
  }

  // Firestore එකෙන් ලැඛෙන Data Object එකක් බවට හැරවීම
  factory UserModel.fromMap(Map<String, dynamic> map) {
    return UserModel(
      uid: map['uid'] ?? '',
      fullName: map['fullName'] ?? '',
      email: map['email'] ?? '',
      phone: map['phone'] ?? '',
      role: map['role'] ?? '',
      district: map['district'] ?? '',
      subjects: map['subjects'] != null ? List<String>.from(map['subjects']) : null,
      hourlyRate: map['hourlyRate'],
      createdAt: (map['createdAt'] as Timestamp?)?.toDate(),
    );
  }
}