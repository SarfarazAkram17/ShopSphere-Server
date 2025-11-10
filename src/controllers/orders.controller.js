// {
//   _id: ObjectId("673234a5b8f9e12345678901"),
//   userEmail: "customer@example.com",
  
//   // Order status
//   orderStatus: "pending",
//   paymentStatus: "unpaid",
  
//   // Addresses
//   shippingAddress: {
//     name: "John Doe",
//     phone: "01712345678",
//     email: "customer@example.com",
//     address: "House# 123, Street# 123, ABC Road",
//     building: "Building 5, Floor 3",
//     thana: "Mirpur",
//     district: "Dhaka",
//     region: "Dhaka Division",
//     label: "HOME"
//   },
  
//   billingAddress: {
//     name: "John Doe",
//     phone: "01712345678",
//     email: "customer@example.com",
//     address: "House# 123, Street# 123, ABC Road",
//     building: "Building 5, Floor 3",
//     thana: "Mirpur",
//     district: "Dhaka",
//     region: "Dhaka Division",
//     label: "HOME"
//   },
  
//   // Store-wise items (grouped by seller)
//   stores: [
//     // Store 1: Fashion Hub
//     {
//       storeId: ObjectId("673234a5b8f9e12345678111"),
//       storeName: "Fashion Hub",
//       storeEmail: "fashionhub@example.com",
//       storeOrderStatus: "pending",
      
//       items: [
//         {
//           productId: ObjectId("673234a5b8f9e12345678aaa"),
//           productName: "Cotton T-Shirt",
//           productImage: "https://example.com/images/tshirt-red.jpg",
//           color: "red",
//           size: "M",
//           quantity: 2,
//           unitPrice: 500,
//           discount: 10,
//           discountedPrice: 450,
//           subtotal: 900
//         },
//         {
//           productId: ObjectId("673234a5b8f9e12345678bbb"),
//           productName: "Denim Jeans",
//           productImage: "https://example.com/images/jeans-blue.jpg",
//           color: "blue",
//           size: "32",
//           quantity: 1,
//           unitPrice: 2000,
//           discount: 15,
//           discountedPrice: 1700,
//           subtotal: 1700
//         }
//       ],
      
//       itemsSubtotal: 2600,
//       deliveryCharge: 80,
//       storeTotal: 2680,
//       platformCommission: 10,
//       platformCommissionAmount: 268,
//       sellerAmount: 2412
//     },
    
//     // Store 2: Electronics World
//     {
//       storeId: ObjectId("673234a5b8f9e12345678222"),
//       storeName: "Electronics World",
//       storeEmail: "electronics@example.com",
//       storeOrderStatus: "pending",
      
//       items: [
//         {
//           productId: ObjectId("673234a5b8f9e12345678ccc"),
//           productName: "Wireless Mouse",
//           productImage: "https://example.com/images/mouse-black.jpg",
//           color: "black",
//           size: null,
//           quantity: 1,
//           unitPrice: 800,
//           discount: 0,
//           discountedPrice: 800,
//           subtotal: 800
//         },
//         {
//           productId: ObjectId("673234a5b8f9e12345678ddd"),
//           productName: "USB-C Cable",
//           productImage: "https://example.com/images/cable-white.jpg",
//           color: "white",
//           size: "1m",
//           quantity: 3,
//           unitPrice: 300,
//           discount: 5,
//           discountedPrice: 285,
//           subtotal: 855
//         }
//       ],
      
//       itemsSubtotal: 1655,
//       deliveryCharge: 150,
//       storeTotal: 1805,
//       platformCommission: 10,
//       platformCommissionAmount: 180.5,
//       sellerAmount: 1624.5
//     },
    
//     // Store 3: Home & Kitchen
//     {
//       storeId: ObjectId("673234a5b8f9e12345678333"),
//       storeName: "Home & Kitchen",
//       storeEmail: "homekitchen@example.com",
//       storeOrderStatus: "pending",
      
//       items: [
//         {
//           productId: ObjectId("673234a5b8f9e12345678eee"),
//           productName: "Non-Stick Frying Pan",
//           productImage: "https://example.com/images/pan-black.jpg",
//           color: "black",
//           size: "12 inch",
//           quantity: 1,
//           unitPrice: 1500,
//           discount: 20,
//           discountedPrice: 1200,
//           subtotal: 1200
//         },
//         {
//           productId: ObjectId("673234a5b8f9e12345678fff"),
//           productName: "Glass Storage Container Set",
//           productImage: "https://example.com/images/container-set.jpg",
//           color: null,
//           size: "5 pcs",
//           quantity: 2,
//           unitPrice: 900,
//           discount: 10,
//           discountedPrice: 810,
//           subtotal: 1620
//         }
//       ],
      
//       itemsSubtotal: 2820,
//       deliveryCharge: 80,
//       storeTotal: 2900,
//       platformCommission: 10,
//       platformCommissionAmount: 290,
//       sellerAmount: 2610
//     }
//   ],
  
//   // Overall order totals
//   itemsTotal: 7075,        // 2600 + 1655 + 2820
//   totalDeliveryCharge: 310, // 80 + 150 + 80
//   totalAmount: 7385,        // 7075 + 310
  
//   // Payment info
//   paymentMethod: "COD",
//   transactionId: null,
  
//   // Timestamps
//   createdAt: ISODate("2024-11-11T10:30:00Z"),
//   updatedAt: ISODate("2024-11-11T10:30:00Z")
// }