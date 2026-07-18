
'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { StatCard, SalesChart, RecentSales, Customer, OrderStatus, Product } from '@/lib/types';
import { format } from 'date-fns';
import { Package, ShoppingCart, DollarSign, AlertTriangle, Briefcase, Calendar, Wrench, Users, Star, TrendingUp, TrendingDown, Activity, Percent } from 'lucide-react';

const isCompletedOrder = (status: OrderStatus) => status === 'completed' || status === 'fulfilled' || status === 'shipped';

export const useDashboardData = () => {
    const { seller, loading, sellerOrders, sellerProducts, sellerCustomers, sellerSuppliers } = useAuth();

    const dynamicData = useMemo(() => {
        if (!seller || !sellerOrders || !sellerProducts || !sellerCustomers || !sellerSuppliers) {
          return {
            totalRevenue: 0,
            totalProfit: 0,
            totalOrders: 0,
            totalProducts: 0,
            pendingOrders: 0,
            totalSupplierSpend: 0,
            salesChartData: [],
            recentSalesData: [],
            customerMap: new Map<string, Customer>(),
          };
        }
    
        const customerMap = new Map<string, Customer>();
        sellerCustomers.forEach(c => customerMap.set(c.id, c));
        
        const productMap = new Map<string, Product>();
        (sellerProducts.filter(p => 'stock' in p) as Product[]).forEach(p => productMap.set(p.id, p));
    
        let totalRevenue = 0;
        let totalCostOfGoodsSold = 0;
        let totalOrders = 0;
        let pendingOrders = 0;
        
        const monthlySales: { [key: string]: { sales: number; revenue: number } } = {};
    
        sellerOrders.forEach(order => {
            totalOrders++;
            if (isCompletedOrder(order.status)) {
                totalRevenue += order.total;
                
                let orderCost = 0;
                order.items.forEach(item => {
                    const product = productMap.get(item.productId);
                    if (product && product.costPrice) {
                        orderCost += product.costPrice * item.quantity;
                    }
                });
                totalCostOfGoodsSold += orderCost;
            }
            if (order.status === 'pending' || order.status === 'upcoming' || order.status === 'in-progress' || order.status === 'awaiting-quote') {
                pendingOrders++;
            }
    
            // Aggregate sales for chart
            const month = format(new Date(order.date), 'MMM');
            if (!monthlySales[month]) monthlySales[month] = { sales: 0, revenue: 0 };
            monthlySales[month].sales++;
            if(isCompletedOrder(order.status)) monthlySales[month].revenue += order.total;
        });
    
        const salesChartData = Object.entries(monthlySales)
            .map(([month, data]) => ({ month, ...data }))
            .slice(-7);
            
        const recentSalesData = sellerOrders
          .slice(0, 5)
          .map(order => {
            const customer = Array.from(customerMap.values()).find(c => c.userId === order.buyerId);
            return {
              name: customer?.name || 'Unknown Customer',
              email: customer?.email || 'N/A',
              amount: `+${order.total.toFixed(2)}`,
              avatar: customer?.avatar || `https://placehold.co/40x40.png?text=A`
            }
          });
          
        const totalProfit = totalRevenue - totalCostOfGoodsSold;
        
        const totalSupplierSpend = sellerSuppliers.reduce((acc, supplier) => acc + supplier.totalSpent, 0);
    
        return {
          totalRevenue,
          totalProfit,
          totalOrders,
          totalProducts: sellerProducts.length,
          pendingOrders,
          totalSupplierSpend,
          salesChartData,
          recentSalesData,
          customerMap,
        };
      }, [seller, sellerOrders, sellerProducts, sellerCustomers, sellerSuppliers]);

      const widgets = useMemo(() => {
        if (!seller) {
          return {
            statCards: [],
            salesChart: { id: 'sales-chart', type: 'salesChart', title: 'Sales Overview', data: [] },
            recentSales: { id: 'recent-sales', type: 'recentSales', title: 'Recent Sales', data: [] },
          };
        }
    
        const isStore = seller.businessType === 'store' || seller.businessType === 'manufacturing';
    
        let baseStatCards: StatCard[] = [];
    
        if (isStore) {
            baseStatCards = [
                { id: 'total-revenue', type: 'statCard', title: 'Revenue', value: `₵${dynamicData.totalRevenue.toFixed(2)}`, change: '+20.1% from last month', icon: DollarSign },
                { id: 'total-profit', type: 'statCard', title: 'Profit', value: `₵${dynamicData.totalProfit.toFixed(2)}`, change: '+25% from last month', icon: TrendingUp },
                { id: 'supplier-spend', type: 'statCard', title: 'Cost', value: `₵${dynamicData.totalSupplierSpend.toFixed(2)}`, change: 'Total procurement cost', icon: TrendingDown },
                { id: 'total-orders', type: 'statCard', title: 'Orders', value: `${dynamicData.totalOrders}`, change: 'Total orders processed', icon: ShoppingCart },
            ];
        } else {
             baseStatCards = [
                { id: 'service-revenue', type: 'statCard', title: 'Revenue', value: `₵${dynamicData.totalRevenue.toFixed(2)}`, change: '+12% from last month', icon: DollarSign },
                { id: 'bookings-this-month', type: 'statCard', title: 'Total Bookings/Jobs', value: String(dynamicData.totalOrders), change: '+30% from last month', icon: Calendar },
                { id: 'success-rate', type: 'statCard', title: 'Success Rate', value: `97.3%`, change: '+2.4% from last month', icon: Percent },
                { id: 'latency', type: 'statCard', title: 'Avg. Latency', value: `234ms`, change: 'Avg. response time', icon: Activity },
            ];
        }
    
        return { 
            statCards: baseStatCards, 
            salesChart: { id: 'sales-chart', type: 'salesChart', title: 'Sales Overview', data: [] },
            recentSales: { id: 'recent-sales', type: 'recentSales', title: 'Recent Sales', data: [] },
        };

      }, [seller, dynamicData]);

      return {
        loading,
        ...widgets
      };
}
