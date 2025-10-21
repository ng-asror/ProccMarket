<?php

namespace App\Services;

use App\Events\NotificationSent;
use App\Models\Notification;
use App\Models\User;

class NotificationService
{
    public function sendNewMessageNotification(int $userId, array $data): Notification
    {
        $sender = User::find($data['sender_id']);
        $user = $sender->name ?? $sender->email;
        
        return $this->createAndBroadcast(
            userId: $userId,
            type: Notification::TYPE_NEW_MESSAGE,
            title: 'Yangi xabar',
            message: "{$user} отправил вам сообщение.",
            data: $data
        );
    }

    public function sendNewConversationNotification(int $userId, array $data): Notification
    {
        $initiator = User::find($data['initiator_id']);
        $user = $initiator->name ?? $initiator->email;
        
        return $this->createAndBroadcast(
            userId: $userId,
            type: Notification::TYPE_NEW_CONVERSATION,
            title: 'Открыт новый чат',
            message: "{$user} начал с вами разговор.",
            data: $data
        );
    }

    public function sendOrderCreatedNotification(int $userId, array $data): Notification
    {
        $creator = User::find($data['creator_id']);
        $user = $creator->name ?? $creator->email;
        
        return $this->createAndBroadcast(
            userId: $userId,
            type: Notification::TYPE_ORDER_CREATED,
            title: 'Новый заказ',
            message: "{$user} создал заказ: {$data['order_title']}",
            data: $data
        );
    }

    public function sendOrderAcceptedNotification(int $userId, array $data): Notification
    {
        $acceptor = User::find($data['acceptor_id']);
        $user = $acceptor->name ?? $acceptor->email;
        
        return $this->createAndBroadcast(
            userId: $userId,
            type: Notification::TYPE_ORDER_ACCEPTED,
            title: 'Заказ получен',
            message: "{$user} получил ваш заказ",
            data: $data
        );
    }

    public function sendOrderDeliveredNotification(int $userId, array $data): Notification
    {
        return $this->createAndBroadcast(
            userId: $userId,
            type: Notification::TYPE_ORDER_DELIVERED,
            title: 'Работа была поручена.',
            message: "Работа была заказана по заказу: {$data['order_title']}",
            data: $data
        );
    }

    public function sendOrderCompletedNotification(int $userId, array $data): Notification
    {
        return $this->createAndBroadcast(
            userId: $userId,
            type: Notification::TYPE_ORDER_COMPLETED,
            title: 'Заказ выполнен',
            message: "Заказ успешно выполнен и оплата произведена.",
            data: $data
        );
    }

    public function sendOrderCancelledNotification(int $userId, array $data): Notification
    {
        $cancelledBy = User::find($data['cancelled_by_id']);
        $user = $cancelledBy->name ?? $cancelledBy->email;
        
        return $this->createAndBroadcast(
            userId: $userId,
            type: Notification::TYPE_ORDER_CANCELLED,
            title: 'Заказ отменен.',
            message: "{$user} отменил заказ",
            data: $data
        );
    }

    public function sendOrderCancellationRequestedNotification(int $userId, array $data): Notification
    {
        $requester = User::find($data['requester_id']);
        $user = $requester->name ?? $requester->email;
        
        return $this->createAndBroadcast(
            userId: $userId,
            type: Notification::TYPE_ORDER_CANCELLATION_REQUESTED,
            title: 'Запрос на отмену',
            message: "{$user} с просьбой отменить заказ",
            data: $data
        );
    }

    public function sendOrderCancellationApprovedNotification(int $userId, array $data): Notification
    {
        return $this->createAndBroadcast(
            userId: $userId,
            type: Notification::TYPE_ORDER_CANCELLATION_APPROVED,
            title: 'Отмена подтверждена',
            message: "Запрос на отмену заказа подтвержден",
            data: $data
        );
    }

    public function sendOrderCancellationRejectedNotification(int $userId, array $data): Notification
    {
        return $this->createAndBroadcast(
            userId: $userId,
            type: Notification::TYPE_ORDER_CANCELLATION_REJECTED,
            title: 'Отмена отклонена',
            message: "Запрос на отмену заказа отклонен",
            data: $data
        );
    }

    public function sendOrderRevisionRequestedNotification(int $userId, array $data): Notification
    {
        return $this->createAndBroadcast(
            userId: $userId,
            type: Notification::TYPE_ORDER_REVISION_REQUESTED,
            title: 'Обработка запроса',
            message: "Заказ отправлен на обработку",
            data: $data
        );
    }

    public function sendOrderDisputedNotification(int $userId, array $data): Notification
    {
        $disputeRaiser = User::find($data['dispute_raised_by_id']);
        $user = $disputeRaiser->name ?? $disputeRaiser->email;
        
        return $this->createAndBroadcast(
            userId: $userId,
            type: Notification::TYPE_ORDER_DISPUTED,
            title: 'Конфликт создан',
            message: "{$user} создал спор по заказу",
            data: $data
        );
    }

    private function createAndBroadcast(
        int $userId,
        string $type,
        string $title,
        string $message,
        array $data
    ): Notification {
        $notification = Notification::create([
            'user_id' => $userId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'data' => $data,
        ]);

        // Broadcast the notification
        broadcast(new NotificationSent($notification));

        return $notification;
    }
}