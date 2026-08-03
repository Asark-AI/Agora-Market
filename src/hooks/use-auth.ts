
'use client';

import { create } from 'zustand';
import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  deleteDoc,
  increment,
  arrayUnion,
  type DocumentReference,
  type Firestore,
  runTransaction,
} from 'firebase/firestore';
import {
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type {
  Seller,
  User,
  Product,
  ServiceProduct,
  Order,
  Customer,
  Supplier,
  NewSupplier,
  RepairRequest,
  AuthState as PublicAuthState,
  Message,
  OrderItem,
  PurchaseOrder,
  StockAdjustment,
  CartItem,
  PayoutMethod,
} from '@/lib/types';
import { db, auth, storage } from '@/lib/firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export interface AuthState extends PublicAuthState {
  unsubscribeListeners: Unsubscribe[];
  dashboardListenersInitialized: boolean;
  setLoading: (loading: boolean) => void;
  clearListeners: () => void;
  clearAllData: () => void;
  init: () => void;
  refreshAuthProfile: () => Promise<void>;
  initDashboardListeners: () => void;
  addCustomer: (customerData: { name: string, email: string, phone: string }) => Promise<Customer>;
}

const uploadFile = async (file: File, path: string): Promise<string> => {
  if (!storage) {
    throw new Error('Storage is unavailable.');
  }

  const storageRef = ref(storage, path);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

const ensureFirestore = (): Firestore => {
  if (!db) {
    throw new Error('Firestore is unavailable.');
  }
  return db;
};

const createFallbackUser = (firebaseUser: FirebaseUser | null): User | null => {
  if (!firebaseUser) {
    return null;
  }

  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || 'Signed In User',
    email: firebaseUser.email || '',
    role: 'Owner',
  };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  seller: null,
  user: null,
  firebaseUser: null,
  sellerProducts: [],
  sellerOrders: [],
  sellerCustomers: [],
  sellerSuppliers: [],
  sellerRepairRequests: [],
  sellerMessages: [],
  sellerPurchaseOrders: [],
  sellerStockAdjustments: [],
  sellerPayoutMethods: [],
  loading: true,
  initialized: false,
  dashboardListenersInitialized: false,
  unsubscribeListeners: [],

  setLoading: (loading) => set({ loading }),

  clearListeners: () => {
    get().unsubscribeListeners.forEach((unsub) => unsub());
    set({ unsubscribeListeners: [], dashboardListenersInitialized: false });
  },

  clearAllData: () => {
    get().clearListeners();
    set({
      user: null,
      firebaseUser: null,
      seller: null,
      sellerProducts: [],
      sellerOrders: [],
      sellerCustomers: [],
      sellerSuppliers: [],
      sellerRepairRequests: [],
      sellerMessages: [],
      sellerPurchaseOrders: [],
      sellerStockAdjustments: [],
      sellerPayoutMethods: [],
      loading: false,
      dashboardListenersInitialized: false,
    });
  },
  
  init: () => {
    if (get().initialized) return;

    if (!auth || !db) {
      set({
        user: null,
        firebaseUser: null,
        seller: null,
        loading: false,
        initialized: true,
        dashboardListenersInitialized: false,
      });
      return;
    }

    try {
      const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        await get().refreshAuthProfile(firebaseUser as FirebaseUser | null);
      });

      set({ initialized: true, loading: false });

      void authUnsubscribe;
    } catch (error) {
      console.warn('Firebase auth initialization failed:', error);
      set({
        user: null,
        firebaseUser: null,
        seller: null,
        loading: false,
        initialized: true,
      });
    }
  },

  refreshAuthProfile: async (firebaseUserOverride?: FirebaseUser | null) => {
    const authUser = firebaseUserOverride ?? auth?.currentUser ?? null;

    set({ firebaseUser: authUser });

    if (!authUser) {
      set({
        user: null,
        firebaseUser: null,
        seller: null,
        loading: false,
        initialized: true,
      });
      return;
    }

    try {
      if (!db) {
        set({ user: null, seller: null, loading: false });
        return;
      }

      const userRef = doc(ensureFirestore(), 'users', authUser.uid);
      const userDoc = await getDoc(userRef);

      let userData: User;
      if (userDoc.exists()) {
        userData = { ...(userDoc.data() as User), id: userDoc.id };
      } else {
        userData = {
          id: authUser.uid,
          name: authUser.displayName || 'New User',
          email: authUser.email || '',
          role: 'Owner',
        };
        await setDoc(userRef, userData);
      }
      set({ user: userData });

      const sellerQuery = query(collection(ensureFirestore(), 'sellers'), where('userId', '==', authUser.uid));
      const sellerSnapshot = await getDocs(sellerQuery);

      if (!sellerSnapshot.empty) {
        const sellerDoc = sellerSnapshot.docs[0];
        const sellerData = { id: sellerDoc.id, ...sellerDoc.data() } as Seller;
        set({ seller: sellerData });
      } else {
        const fallbackSellerRef = doc(ensureFirestore(), 'sellers', authUser.uid);
        const fallbackSellerDoc = await getDoc(fallbackSellerRef);
        if (fallbackSellerDoc.exists()) {
          const sellerData = { id: fallbackSellerDoc.id, ...fallbackSellerDoc.data() } as Seller;
          set({ seller: sellerData });
        } else {
          set({ seller: null });
        }
      }
    } catch (error) {
      console.warn('Firebase auth state handling failed:', error);
      const fallbackUser = createFallbackUser(authUser);
      set({
        firebaseUser: authUser,
        user: fallbackUser,
        seller: get().seller ?? null,
        loading: false,
        initialized: true,
      });
    } finally {
      set({ loading: false, initialized: true });
    }
  },

  initDashboardListeners: () => {
    const { seller, dashboardListenersInitialized } = get();
    if (!seller || dashboardListenersInitialized) {
        return;
    }

    const unsubscribes: Unsubscribe[] = [];

    if (!db) {
        return;
    }

    const collectionsToSync = [
        { name: 'sellerProducts', path: `sellers/${seller.id}/products` },
        { name: 'sellerOrders', path: `sellers/${seller.id}/orders` },
        { name: 'sellerCustomers', path: `sellers/${seller.id}/customers` },
        { name: 'sellerSuppliers', path: `sellers/${seller.id}/suppliers` },
        { name: 'sellerRepairRequests', path: `sellers/${seller.id}/repairRequests` },
        { name: 'sellerMessages', path: `sellers/${seller.id}/messages` },
        { name: 'sellerPurchaseOrders', path: `sellers/${seller.id}/purchaseOrders` },
        { name: 'sellerStockAdjustments', path: `sellers/${seller.id}/stockAdjustments` },
        { name: 'sellerPayoutMethods', path: `sellers/${seller.id}/payoutMethods` },
    ];

    const firestore = db as NonNullable<typeof db>;

    collectionsToSync.forEach(({ name, path }) => {
        const q = query(collection(firestore, path));
        const unsub = onSnapshot(q,
            (snapshot) => {
                const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                set({ [name]: data });
            },
            (error) => {
                const permissionError = new FirestorePermissionError({path, operation: 'read-list'}, error as Error);
                errorEmitter.emit('permission-error', permissionError);
            }
        );
        unsubscribes.push(unsub);
    });
    
    set({ 
        unsubscribeListeners: unsubscribes,
        dashboardListenersInitialized: true 
    });
  },

  signUp: async (email, password, name) => {
    if (!auth || !db) {
      throw new Error('Authentication is unavailable.');
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    const newUser: User = { id: user.uid, name, email, role: 'Owner' };
    set({ user: newUser, firebaseUser: user, loading: false, initialized: true });
    await setDoc(doc(ensureFirestore(), 'users', user.uid), newUser);
    await get().refreshAuthProfile(user);
    return user;
  },

  logIn: async (email, password) => {
    if (!auth) {
      throw new Error('Authentication is unavailable.');
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const authUser = userCredential.user;
      const fallbackUser = createFallbackUser(authUser);
      set({ firebaseUser: authUser, user: fallbackUser, loading: false, initialized: true });
      await get().refreshAuthProfile(authUser);
      return authUser;
    } catch (error: any) {
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/user-not-found' || error?.code === 'auth/wrong-password') {
        throw new Error('The email or password is incorrect.');
      }
      throw error;
    }
  },

  signInWithGoogle: async () => {
    if (!auth || !db) {
      throw new Error('Authentication is unavailable.');
    }

    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const { user } = result;
    const fallbackUser = createFallbackUser(user);
    set({ firebaseUser: user, user: fallbackUser, loading: false, initialized: true });

    const userRef = doc(ensureFirestore(), 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      const newUser: User = {
        id: user.uid,
        name: user.displayName || 'New User',
        email: user.email!,
        role: 'Owner',
      };
      await setDoc(doc(ensureFirestore(), 'users', user.uid), newUser);
      set({ user: newUser, firebaseUser: user });
    }
    await get().refreshAuthProfile(user);
    return user;
  },

  logOut: async () => {
    if (!auth) {
      return;
    }

    if (!auth) {
      return;
    }

    await signOut(auth);
    // onAuthStateChanged in init() will handle clearing the state.
  },

  setSeller: (seller) => set({ seller }),

  addSeller: async (sellerData, logoFile, bannerFile) => {
    const user = get().user;
    if (!user) throw new Error('User not authenticated');

    const finalSellerData: Omit<Seller, 'id'> = { ...sellerData };

    if (logoFile) {
        finalSellerData.logoUrl = await uploadFile(logoFile, `sellers/${user.id}/logo-${Date.now()}`);
    }
    if (bannerFile) {
        finalSellerData.storefrontBannerUrl = await uploadFile(bannerFile, `sellers/${user.id}/banner-${Date.now()}`);
    }
    
    if (!db) {
        throw new Error('Firestore is unavailable.');
    }

    const docRef = await addDoc(collection(ensureFirestore(), 'sellers'), finalSellerData);
    const newSeller = { id: docRef.id, ...finalSellerData };
    set({ seller: newSeller as Seller });
    await get().refreshAuthProfile(auth?.currentUser ?? null);
    await new Promise((resolve) => setTimeout(resolve, 500));
    await get().refreshAuthProfile(auth?.currentUser ?? null);
    return newSeller as Seller;
  },

  addProduct: async (productData, imageFiles, videoFiles) => {
     const seller = get().seller;
    if (!seller) throw new Error('Seller not found');

    const firestore = ensureFirestore();
    const imageUrls: string[] = [];
    const videoUrls: string[] = [];
    
    if (imageFiles) {
        for (const file of Array.from(imageFiles)) {
            const url = await uploadFile(file, `sellers/${seller.id}/products/${Date.now()}-${file.name}`);
            imageUrls.push(url);
        }
    }
    
    if (videoFiles) {
        for (const file of Array.from(videoFiles)) {
            const url = await uploadFile(file, `sellers/${seller.id}/products/videos/${Date.now()}-${file.name}`);
            videoUrls.push(url);
        }
    }

    const descriptionKeywords =
      typeof productData.description === 'string'
        ? productData.description
        : productData.description?.english || '';

    let englishDescription = productData.description?.english || '';

    try {
      const { generateProductDescription } = await import('@/ai/flows/generate-product-description');
      const result = await generateProductDescription({
        shortDescription: productData.name,
        keywords: descriptionKeywords,
      });
      englishDescription = result.englishDescription;
    } catch (error) {
      console.warn('AI description generation unavailable, using fallback text:', error);
      englishDescription = productData.name || 'Product description pending';
    }

    if (!db) {
      throw new Error('Firestore is unavailable.');
    }
    
    await addDoc(collection(firestore, 'sellers', seller.id, 'products'), {
      ...productData,
      description: englishDescription,
      images: imageUrls,
      videos: videoUrls,
      sellerId: seller.id,
      userId: seller.userId,
      createdAt: serverTimestamp(),
      views: 0,
      favorites: 0,
      clicks: 0,
      clickHistory: [],
    });
  },

  updateProduct: async (productId, updates) => {
     const seller = get().seller;
    if (!seller) throw new Error("Seller not authenticated.");
    const firestore = ensureFirestore();
    const productRef = doc(firestore, 'sellers', seller.id, 'products', productId);
    await updateDoc(productRef, updates);
  },

  updateSeller: async (sellerId, updates) => {
    const firestore = ensureFirestore();
    const sellerRef = doc(firestore, 'sellers', sellerId);
    set(state => ({
        seller: state.seller ? { ...state.seller, ...updates } : null
    }));
    try {
        await updateDoc(sellerRef, updates);
    } catch (serverError: any) {
        const permissionError = new FirestorePermissionError({
            path: sellerRef.path,
            operation: 'update',
            requestResourceData: updates
        }, serverError as Error);
        errorEmitter.emit('permission-error', permissionError);
        throw serverError;
    }
  },

  updateSellerProfile: async (sellerId, updates, logoFile, bannerFile) => {
    const user = get().user;
    if (!user) throw new Error('User not authenticated');
    
    const finalUpdates: Partial<Seller> = { ...updates };

    if (logoFile) {
        finalUpdates.logoUrl = await uploadFile(logoFile, `sellers/${user.id}/logo-${Date.now()}`);
    }
    if (bannerFile) {
        finalUpdates.storefrontBannerUrl = await uploadFile(bannerFile, `sellers/${user.id}/banner-${Date.now()}`);
    }

    const sellerRef = doc(ensureFirestore(), 'sellers', sellerId);
    
    set(state => ({
        seller: state.seller ? { ...state.seller, ...finalUpdates } : null
    }));

    updateDoc(sellerRef, finalUpdates)
        .catch((serverError: Error) => {
            const permissionError = new FirestorePermissionError({
                path: sellerRef.path,
                operation: 'update',
                requestResourceData: finalUpdates
            }, serverError);
            errorEmitter.emit('permission-error', permissionError);
        });
  },

  addSupplier: async (supplierData) => {
    const seller = get().seller;
    if (!seller) throw new Error('Seller not authenticated');
    await addDoc(collection(ensureFirestore(), 'sellers', seller.id, 'suppliers'), {
      ...supplierData,
      userId: seller.userId,
      totalSpent: 0,
    });
  },

  deleteSeller: async (sellerId) => {
    const sellerRef = doc(ensureFirestore(), 'sellers', sellerId);
    await deleteDoc(sellerRef);
    get().logOut();
  },

  addRepairRequest: async (sellerId, userId, requestData, photoFiles) => {
    const photoUrls: string[] = [];
    if (photoFiles) {
        for (const file of Array.from(photoFiles)) {
            const url = await uploadFile(file, `repairRequests/${userId}/${Date.now()}-${file.name}`);
            photoUrls.push(url);
        }
    }
    
    await addDoc(collection(ensureFirestore(), 'repairRequests'), {
      ...requestData,
      sellerId,
      buyerId: userId,
      userId: userId,
      status: 'pending',
      photos: photoUrls,
      createdAt: serverTimestamp(),
      ticketNumber: `R${Date.now().toString().slice(-6)}`
    });
  },

  updateRepairRequest: async (repairId, updates) => {
    const repairRef = doc(ensureFirestore(), 'repairRequests', repairId);
    await updateDoc(repairRef, updates);
  },
  
  addOrderFromCart: async (sellerId, items, total, transactionId) => {
    const user = get().user;
    if (!user) throw new Error('User not authenticated');

    const customerRef = doc(ensureFirestore(), 'sellers', sellerId, 'customers', user.id);
    const customerSnap = await getDoc(customerRef);
    if (!customerSnap.exists()) {
        await setDoc(customerRef, {
            userId: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone || '',
            avatar: `https://i.pravatar.cc/150?u=${user.id}`,
            lastOrderDate: new Date().toISOString(),
            totalOrders: 1,
            totalSpent: total,
            regionId: get().seller?.regionId || '',
        });
    } else {
        await updateDoc(customerRef, {
            totalOrders: increment(1),
            totalSpent: increment(total),
            lastOrderDate: new Date().toISOString(),
        });
    }
    
    const orderData: Omit<Order, 'id'> = {
        buyerId: user.id,
        userId: user.id,
        date: new Date().toISOString(),
        total,
        status: 'pending',
        items: items.map(item => ({
            productId: item.product.id,
            quantity: item.quantity,
            price: (item.product as Product).discountPrice ?? (item.product as Product).price
        })),
        paymentMethod: 'flutterwave',
        transactionId: transactionId
    };
    
    await addDoc(collection(ensureFirestore(), 'sellers', sellerId, 'orders'), orderData);
    
    for (const item of items) {
        if ('stock' in item.product) {
            const productRef = doc(ensureFirestore(), 'sellers', sellerId, 'products', item.product.id);
            await updateDoc(productRef, {
                stock: increment(-item.quantity)
            });
        }
    }
  },

  addOrder: async (sellerId, orderData, customerDetails) => {
    let customerId;
    const q = query(collection(ensureFirestore(), 'customers'), where('email', '==', customerDetails.email));
    const customerSnapshot = await getDocs(q);

    if (customerSnapshot.empty) {
      const customerDoc = await addDoc(collection(ensureFirestore(), 'customers'), {
        ...customerDetails,
        totalOrders: 1,
        totalSpent: orderData.total,
        lastOrderDate: new Date().toISOString(),
      });
      customerId = customerDoc.id;
    } else {
      const customerDoc = customerSnapshot.docs[0];
      customerId = customerDoc.id;
      await updateDoc(customerDoc.ref, {
        totalOrders: increment(1),
        totalSpent: increment(orderData.total),
        lastOrderDate: new Date().toISOString(),
      });
    }

    await addDoc(collection(ensureFirestore(), 'orders'), {
      ...orderData,
      buyerId: customerId,
      sellerId: sellerId,
      date: new Date().toISOString(),
      status: 'pending'
    });
  },

    addWalkInOrder: async (items, total, customerId, paymentMethod) => {
        const seller = get().seller;
        if (!seller) throw new Error("Seller not found");

        const docRef = await addDoc(collection(ensureFirestore(), 'sellers', seller.id, 'orders'), {
            buyerId: customerId,
            userId: customerId,
            date: new Date().toISOString(),
            total: total,
            status: 'fulfilled',
            items,
            paymentMethod,
        });

        const customerRef = doc(ensureFirestore(), 'sellers', seller.id, 'customers', customerId);
        await updateDoc(customerRef, {
            totalOrders: increment(1),
            totalSpent: increment(total),
            lastOrderDate: new Date().toISOString(),
        });
        
        for (const item of items) {
            if (item.quantity > 0) {
                const productRef = doc(ensureFirestore(), 'sellers', seller.id, 'products', item.productId);
                await updateDoc(productRef, {
                    stock: increment(-item.quantity)
                });
            }
        }
        
        return docRef.id;
    },
    
    addCustomer: async (customerData) => {
        const seller = get().seller;
        if (!seller) throw new Error("Seller not found");
        
        const q = query(collection(ensureFirestore(), 'sellers', seller.id, 'customers'), where("email", "==", customerData.email));
        const existing = await getDocs(q);
        if (!existing.empty) {
            throw new Error("A customer with this email already exists.");
        }
        
        const newCustomerRef = doc(collection(ensureFirestore(), 'sellers', seller.id, 'customers'));

        const newCustomer: Omit<Customer, 'id'> & { id: string } = {
            id: newCustomerRef.id,
            userId: newCustomerRef.id,
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone || '',
            avatar: `https://i.pravatar.cc/150?u=${customerData.email}`,
            lastOrderDate: new Date().toISOString(),
            totalOrders: 0,
            totalSpent: 0,
            regionId: seller.regionId,
        };
        await setDoc(newCustomerRef, newCustomer);
        return newCustomer as Customer;
    },

  
  addPurchaseOrder: (po) => {
    const seller = get().seller;
    if (!seller) return;
    addDoc(collection(ensureFirestore(), 'sellers', seller.id, 'purchaseOrders'), po);
  },

  followSeller: async (sellerId: string) => {
    const user = get().user;
    if (!user) {
      throw new Error('Please sign in to follow sellers.');
    }
    if (sellerId === get().seller?.id) {
      throw new Error('You cannot follow your own store.');
    }

    const firestore = ensureFirestore();
    const sellerRef = doc(firestore, 'sellers', sellerId);
    const followerRef = doc(firestore, 'sellers', sellerId, 'followers', user.id);

    const added = await runTransaction(firestore, async (transaction) => {
      const followerSnapshot = await transaction.get(followerRef);
      if (followerSnapshot.exists()) {
        return false;
      }

      transaction.set(followerRef, {
        userId: user.id,
        followedAt: serverTimestamp(),
      });
      transaction.update(sellerRef, {
        followerCount: increment(1),
      });
      return true;
    });

    return added;
  },

  rateProduct: async (sellerId: string, productId: string, rating: number, review = '') => {
    const user = get().user;
    if (!user) {
      throw new Error('Please sign in to rate products.');
    }

    const firestore = ensureFirestore();
    const productRef = doc(firestore, 'sellers', sellerId, 'products', productId);
    const reviewRef = doc(firestore, 'sellers', sellerId, 'products', productId, 'reviews', user.id);

    const result = await runTransaction(firestore, async (transaction) => {
      const productSnapshot = await transaction.get(productRef);
      if (!productSnapshot.exists()) {
        throw new Error('Product not found.');
      }

      const reviewSnapshot = await transaction.get(reviewRef);
      const productData = productSnapshot.data();
      const previousRating = reviewSnapshot.exists() ? reviewSnapshot.data()?.rating || 0 : 0;
      const currentCount = productData.ratingCount ?? 0;
      const currentTotal = productData.ratingTotal ?? (productData.ratingAverage ? productData.ratingAverage * currentCount : 0);
      const newCount = reviewSnapshot.exists() ? currentCount : currentCount + 1;
      const newTotal = currentTotal - previousRating + rating;
      const newAverage = newCount > 0 ? newTotal / newCount : 0;

      transaction.set(reviewRef, {
        userId: user.id,
        rating,
        review,
        createdAt: serverTimestamp(),
      });
      transaction.update(productRef, {
        ratingAverage: newAverage,
        ratingCount: newCount,
        ratingTotal: newTotal,
      });

      return {
        ratingAverage: newAverage,
        ratingCount: newCount,
        ratingTotal: newTotal,
      };
    });

    return result;
  },

  sendMessage: async (customerId, text) => {
    const seller = get().seller;
    const user = get().user;
    if (!seller || !user) return;
    
    await addDoc(collection(ensureFirestore(), 'sellers', seller.id, 'messages'), {
        customerId,
        text,
        senderId: user.id,
        timestamp: new Date().toISOString(),
        read: false
    });
  },

  addStockAdjustment: async (adjustment) => {
    const seller = get().seller;
    const user = get().user;
    if (!seller || !user) throw new Error('Not authenticated');

    const productRef = doc(ensureFirestore(), 'sellers', seller.id, 'products', adjustment.productId);
    const adjustmentRef = doc(collection(ensureFirestore(), 'sellers', seller.id, 'stockAdjustments'));

    try {
        await runTransaction(ensureFirestore(), async (transaction) => {
            const productDoc = await transaction.get(productRef);
            if (!productDoc.exists()) {
                throw new Error("Product not found!");
            }

            const currentStock = productDoc.data().stock || 0;
            const change = adjustment.type === 'addition' ? adjustment.quantity : -adjustment.quantity;
            const newStock = currentStock + change;
            
            if (newStock < 0) {
                throw new Error("Stock cannot go below zero.");
            }
            
            transaction.update(productRef, { stock: newStock });

            transaction.set(adjustmentRef, {
                ...adjustment,
                date: new Date().toISOString(),
                userId: user.id,
            });
        });
    } catch (e: any) {
        const permissionError = new FirestorePermissionError({path: productRef.path, operation: 'update'}, e as Error);
        errorEmitter.emit('permission-error', permissionError);
        throw e;
    }
  },

  addPayoutMethod: async (methodData) => {
    const { seller } = get();
    if (!seller) {
      console.error("addPayoutMethod called without a seller.");
      return;
    }

    const payoutMethodsRef = collection(ensureFirestore(), 'sellers', seller.id, 'payoutMethods');
    
    let isFirstMethod = false;
    try {
      const querySnapshot = await getDocs(payoutMethodsRef);
      isFirstMethod = querySnapshot.empty;
    } catch (serverError: any) {
      const permissionError = new FirestorePermissionError({
        path: payoutMethodsRef.path,
        operation: 'read-list',
      }, serverError);
      errorEmitter.emit('permission-error', permissionError);
      return; 
    }
    
    const dataToAdd = {
        ...methodData,
        isDefault: isFirstMethod,
    };

    addDoc(payoutMethodsRef, dataToAdd)
        .catch((serverError: Error) => {
            const permissionError = new FirestorePermissionError({
                path: payoutMethodsRef.path,
                operation: 'create',
                requestResourceData: dataToAdd,
            }, serverError);
            errorEmitter.emit('permission-error', permissionError);
        });
  },

  removePayoutMethod: async (methodId: string) => {
      const { seller } = get();
      if (!seller) throw new Error("Seller not authenticated");
      
      const methodRef = doc(ensureFirestore(), 'sellers', seller.id, 'payoutMethods', methodId);
      await deleteDoc(methodRef);
  },

  setDefaultPayoutMethod: async (methodId: string) => {
      const { seller } = get();
      if (!seller) throw new Error("Seller not authenticated");
      
      const payoutMethodsRef = collection(ensureFirestore(), 'sellers', seller.id, 'payoutMethods');
      
      await runTransaction(ensureFirestore(), async (transaction) => {
          const snapshot = await getDocs(query(payoutMethodsRef));
          snapshot.forEach((doc) => {
              transaction.update(doc.ref, { isDefault: false });
          });
          
          const newDefaultRef = doc(ensureFirestore(), 'sellers', seller.id, 'payoutMethods', methodId);
          transaction.update(newDefaultRef, { isDefault: true });
      });
  },

  requestWithdrawal: async (amount, methodId) => {
    const { seller } = get();
    if (!seller) throw new Error("Seller not authenticated");

    const withdrawalData = {
      sellerId: seller.id,
      amount,
      payoutMethodId: methodId,
      status: 'pending',
      requestedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(ensureFirestore(), 'withdrawalRequests'), withdrawalData);
    return docRef.id;
  },
}));

export const useAuth = useAuthStore;
