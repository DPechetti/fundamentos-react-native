import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStorage = await AsyncStorage.getItem(
        '@GoMarketplace:products',
      );

      if (productsStorage) {
        setProducts(JSON.parse(productsStorage));
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const product = products.map(prod =>
        prod.id === id ? { ...prod, quantity: prod.quantity + 1 } : prod,
      );

      setProducts(product);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(product),
      );
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const product = products
        .map(prod =>
          prod.id === id
            ? {
                ...prod,
                quantity: prod.quantity > 0 ? prod.quantity - 1 : prod.quantity,
              }
            : prod,
        )
        .filter(prod => !!prod.quantity);

      setProducts(product);

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(product),
      );
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const alreadyInCart = products.find(prod => prod.id === product.id);

      if (alreadyInCart) {
        increment(product.id);
      } else {
        setProducts(oldProducts => [
          ...oldProducts,
          { ...product, quantity: 1 },
        ]);
      }

      await AsyncStorage.setItem(
        '@GoMarketplace:products',
        JSON.stringify(products),
      );
    },
    [increment, products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
