import '../../domain/entities/order.dart';
import '../../domain/entities/client.dart';
import '../../domain/entities/order_item.dart';
import '../../domain/entities/product.dart';

final _mockProducts = [
  const Product(id: '1', code: 'SIM-1001', name: 'Carte SIM 4G', nominalPrice: 10000, discountPercent: 3, stockQuantity: 1250),
  const Product(id: '2', code: 'SIM-1002', name: 'Carte SIM 5G Premium', nominalPrice: 15000, discountPercent: 2, stockQuantity: 800),
  const Product(id: '3', code: 'CRD-2001', name: 'Crédit Mobile 500 DA', nominalPrice: 500, discountPercent: 5, stockQuantity: 15000),
  const Product(id: '4', code: 'CRD-2002', name: 'Crédit Mobile 1000 DA', nominalPrice: 1000, discountPercent: 4, stockQuantity: 12000),
  const Product(id: '5', code: 'CRD-2003', name: 'Crédit Mobile 2000 DA', nominalPrice: 2000, discountPercent: 3.5, stockQuantity: 8000),
  const Product(id: '6', code: 'PKG-3001', name: 'Forfait Internet 10 Go', nominalPrice: 2500, discountPercent: 2, stockQuantity: 5000),
];

final _mockClients = [
  const Client(id: '1', code: 'CLI-00215', name: 'Boutique El Wafa', region: 'Région Est', wilaya: 'Sétif', address: 'Cité 1044', phone: '0550 25 36 98'),
  const Client(id: '2', code: 'CLI-00087', name: 'CyberTech Plus', region: 'Région Est', wilaya: 'Batna', address: 'Centre Ville', phone: '0330 45 12 78'),
  const Client(id: '3', code: 'CLI-00342', name: 'Phone Center', region: 'Région Nord', wilaya: 'Alger', address: 'Bab Ezzouar', phone: '0210 88 33 44'),
  const Client(id: '4', code: 'CLI-00198', name: 'Digital World', region: 'Région Est', wilaya: 'Constantine', address: 'Ali Mendjeli', phone: '0310 67 22 55'),
  const Client(id: '5', code: 'CLI-00456', name: 'TechMobile Store', region: 'Région Ouest', wilaya: 'Oran', address: 'Bir El Djir', phone: '0410 32 88 11'),
  const Client(id: '6', code: 'CLI-00123', name: 'SIM Plus Distribution', region: 'Région Est', wilaya: 'Tébessa', address: 'Centre Ville', phone: '0360 22 44 66'),
  const Client(id: '7', code: 'CLI-00567', name: 'Alger Telecom Shop', region: 'Région Nord', wilaya: 'Alger', address: 'Hussein Dey', phone: '0210 55 77 88'),
  const Client(id: '8', code: 'CLI-00891', name: 'Mobile Express', region: 'Région Est', wilaya: 'Guelma', address: 'Centre Ville', phone: '0340 11 22 33'),
];

final statuses = [
  OrderStatus.pending,
  OrderStatus.approved,
  OrderStatus.preparing,
  OrderStatus.delivered,
  OrderStatus.rejected,
  OrderStatus.cancelled,
];

List<Order> generateMockOrders({int count = 50}) {
  final now = DateTime.now();
  return List.generate(count, (index) {
    final client = _mockClients[index % _mockClients.length];
    final productCount = 1 + (index % 3);
    final items = List.generate(productCount, (i) {
      final product = _mockProducts[(index + i) % _mockProducts.length];
      final qty = 10 + (index * 7 + i * 13) % 200;
      return OrderItem(product: product, quantity: qty);
    });

    final date = now.subtract(Duration(days: index ~/ 3, hours: index % 24));
    final status = statuses[index % statuses.length];

    return Order(
      id: '${1000 + index}',
      orderNumber: 'CMD-${date.year}${date.month.toString().padLeft(2, '0')}${date.day.toString().padLeft(2, '0')}-${(index + 1).toString().padLeft(4, '0')}',
      client: client,
      items: items,
      status: status,
      createdAt: date,
      updatedAt: date.add(Duration(hours: index % 5)),
    );
  });
}

final mockOrders = generateMockOrders(count: 50);
