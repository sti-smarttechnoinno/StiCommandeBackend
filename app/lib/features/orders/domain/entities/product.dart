class Product {
  final String id;
  final String code;
  final String name;
  final String? barcode;
  final double nominalPrice;
  final double discountPercent;
  final int? stockQuantity;
  final bool trackStock;
  final String? category;
  final bool? isVirtualOverride;
  final String? imageUrl;

  const Product({
    required this.id,
    required this.code,
    required this.name,
    this.barcode,
    this.category,
    this.isVirtualOverride,
    required this.nominalPrice,
    this.discountPercent = 0,
    this.stockQuantity,
    this.trackStock = true,
    this.imageUrl,
  });

  bool get isVirtual {
    if (isVirtualOverride != null) return isVirtualOverride!;
    final cat = (category ?? '').toLowerCase();
    final n = name.toLowerCase();
    return cat.contains('credit') ||
        cat.contains('recharge') ||
        cat == 'mobile_credit' ||
        n.contains('recharge') ||
        n.contains('storm') ||
        n.contains('flexy');
  }

  /// When stock quantity is not set (null) or stock is not tracked, there is NO limit for quantity.
  bool get hasStockLimit => !isVirtual && trackStock && stockQuantity != null;

  /// Product is out of stock only when stock limit is enforced and stock <= 0.
  bool get isOutOfStock => hasStockLimit && (stockQuantity ?? 0) <= 0;

  double get sellingPrice =>
      nominalPrice * (1 - discountPercent / 100);

  double get discountAmount =>
      nominalPrice * discountPercent / 100;

  factory Product.fromJson(Map<String, dynamic> json) {
    final rawPrice = json['nominalPrice'] ?? json['nominal_price'] ?? json['price'] ?? json['faceValue'] ?? 0;
    final rawDiscount = json['discountPercent'] ?? json['discount_percent'] ?? 0;
    final rawStock = json['stockQuantity'] ?? json['stock_quantity'] ?? json['stock'];
    final rawTrackStock = json['track_stock'] ?? json['trackStock'];
    final rawCategory = json['category']?.toString() ?? json['category_name']?.toString();
    final isVirt = json['is_virtual'] == true || json['isVirtual'] == true ? true : (json['is_virtual'] == false || json['isVirtual'] == false ? false : null);

    final trackStock = rawTrackStock == null ? true : (rawTrackStock == true || rawTrackStock == 1 || rawTrackStock.toString() == 'true');
    final stockQty = rawStock != null
        ? ((rawStock is num) ? rawStock.toInt() : int.tryParse(rawStock.toString()))
        : null;

    return Product(
      id: json['id']?.toString() ?? '',
      code: json['sku']?.toString() ?? json['code']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Produit sans nom',
      barcode: json['barcode']?.toString(),
      category: rawCategory,
      isVirtualOverride: isVirt,
      nominalPrice: (rawPrice is num) ? rawPrice.toDouble() : (double.tryParse(rawPrice.toString()) ?? 0.0),
      discountPercent: (rawDiscount is num) ? rawDiscount.toDouble() : (double.tryParse(rawDiscount.toString()) ?? 0.0),
      stockQuantity: stockQty,
      trackStock: trackStock,
      imageUrl: json['imageUrl']?.toString() ?? json['image_url']?.toString(),
    );
  }
}
