import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { Loader, ErrorState } from '../components/common/Loader';
import { OrderDetails } from '../components/orders/OrderDetails';
import { EditOrderForm } from '../components/orders/EditOrderForm';

export const OrderDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { orders, loadOrders, isLoading } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  
  const order = orders.find(o => o.id === Number(id));

  useEffect(() => {
    if (orders.length === 0) {
      loadOrders();
    }
  }, [loadOrders, orders.length]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleEditSuccess = () => {
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div style={{ padding: '20px' }}>
        <Loader text="Загрузка деталей заказа..." />
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '20px' }}>
        <ErrorState 
          message="Заказ не найден" 
          onRetry={() => loadOrders()} 
        />
      </div>
    );
  }

  return (
    <div>
      {isEditing ? (
        <EditOrderForm 
          order={order} 
          onSuccess={handleEditSuccess} 
          onCancel={handleEditCancel}
        />
      ) : (
        <OrderDetails 
          order={order} 
          onEdit={handleEdit} 
          onClose={handleBack}
        />
      )}
    </div>
  );
};