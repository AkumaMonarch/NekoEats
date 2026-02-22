import { MenuItem } from './types';

export const MOCK_MENU: MenuItem[] = [
  {
    id: '1',
    name: 'The Smoky Texas Stack',
    description: 'Double beef patty, smoked brisket, cheddar, onion rings, BBQ sauce.',
    price: 16.50,
    image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'burgers',
    popular: true,
    in_stock: true,
    variants: [
      { id: 'v1', name: 'Single Patty', price: 14.50 },
      { id: 'v2', name: 'Double Patty', price: 16.50 },
    ],
    addons: [
      { id: 'a1', name: 'Extra Cheese', price: 1.50 },
      { id: 'a2', name: 'Bacon', price: 2.00 },
    ]
  },
  {
    id: '2',
    name: 'Signature Wagyu',
    description: 'Premium wagyu beef, truffle aioli, arugula, brioche bun.',
    price: 18.50,
    image_url: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'burgers',
    popular: true,
    in_stock: true,
    addons: [
      { id: 'a1', name: 'Extra Cheese', price: 1.50 },
      { id: 'a3', name: 'Fried Egg', price: 1.50 },
    ]
  },
  {
    id: '3',
    name: 'Double Jalapeño',
    description: 'Spicy jalapeños, pepper jack cheese, chipotle mayo.',
    price: 14.50,
    image_url: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'burgers',
    in_stock: true,
  },
  {
    id: '4',
    name: 'Truffle Parmesan Fries',
    description: 'Crispy fries tossed in truffle oil and parmesan cheese.',
    price: 7.50,
    image_url: 'https://images.unsplash.com/photo-1573080496987-a199f8cd75ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'sides',
    popular: true,
    in_stock: true,
  },
  {
    id: '5',
    name: 'Buffalo Wings',
    description: '6pcs wings tossed in spicy buffalo sauce.',
    price: 9.99,
    image_url: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'sides',
    in_stock: true,
  },
  {
    id: '6',
    name: 'Handcrafted Lemonade',
    description: 'Freshly squeezed lemons with a hint of mint.',
    price: 4.50,
    image_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'drinks',
    in_stock: true,
  },
  {
    id: '7',
    name: 'Vintage Old Fashioned',
    description: 'Non-alcoholic classic cocktail.',
    price: 8.00,
    image_url: 'https://images.unsplash.com/photo-1597075687490-8f673c6c17f6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'drinks',
    in_stock: true,
  },
  {
    id: '8',
    name: 'Truffle Choco Lava',
    description: 'Molten chocolate cake with vanilla ice cream.',
    price: 9.50,
    image_url: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'desserts',
    in_stock: false,
  }
];
