import { defineStore } from 'pinia'
import { useChannelStore } from './channel-store'
import { api } from 'boot/axios'

export type NotificationSetting = 0 | 1 | 2 // 0: all, 1: mentions only, 2: muted

export const useNotificationStore = defineStore('notifications', {
    state: () => ({
        setting: Number(localStorage.getItem('notification_setting') || '0') as NotificationSetting,
        isAppVisible: true, // Track app visibility
        currentUserId: null as string | null,
    }),

    getters: {
        shouldNotify: (state) => state.setting !== 2, // Don't notify if muted
        shouldNotifyMentionsOnly: (state) => state.setting === 1,
        shouldNotifyAll: (state) => state.setting === 0,
    },

    actions: {
        setSetting(value: NotificationSetting) {
            this.setting = value
            localStorage.setItem('notification_setting', String(value))
        },

        setAppVisible(visible: boolean) {
            this.isAppVisible = visible
        },

        async loadCurrentUserId() {
            if (this.currentUserId) return this.currentUserId
            try {
                const response = await api.get('/api/auth/me')
                this.currentUserId = String(response.data.user?.id)
                return this.currentUserId
            } catch (error) {
                console.error('Failed to load current user ID:', error)
                return null
            }
        },

        async showNotification(
            title: string,
            message: string,
            channelId: string,
            isMention: boolean = false
        ) {
            console.log('[Notifications] showNotification called', {
                title,
                message,
                channelId,
                isMention,
                documentHidden: document.hidden,
                notificationPermission: 'Notification' in window ? Notification.permission : 'not supported',
                setting: this.setting
            })

            // Check notification settings FIRST
            if (!this.shouldNotify) {
                console.log('[Notifications] Skipping - notifications muted (setting = 2)')
                return
            }

            if (this.shouldNotifyMentionsOnly && !isMention) {
                console.log('[Notifications] Skipping - mentions only mode, but not a mention')
                return
            }

            // Get current user ID
            const currentUserId = await this.loadCurrentUserId()
            if (!currentUserId) {
                console.log('[Notifications] Skipping - no current user ID')
                return
            }

            // Don't notify if user is viewing this channel
            const channels = useChannelStore()
            const activeChannelId = channels.activeChannelId
            const isActiveChannel = activeChannelId === channelId

            console.log('[Notifications] Channel check:', {
                activeChannelId,
                messageChannelId: channelId,
                isActiveChannel,
                channelsCount: channels.channels.length
            })

            if (isActiveChannel) {
                console.log('[Notifications] Skipping - user is viewing this channel')
                return
            }

            console.log('[Notifications] All checks passed, attempting to show notification...')

            // Show browser notification if supported
            if (!('Notification' in window)) {
                console.log('[Notifications] Browser does not support notifications')
                return
            }

            // Check permission and show notification
            if (Notification.permission === 'granted') {
                try {
                    const notification = new Notification(title, {
                        body: message,
                        icon: '/favicon.ico',
                        requireInteraction: false,
                    })
                    console.log('[Notifications] ✅ Notification shown successfully!', notification)
                } catch (error) {
                    console.error('[Notifications] ❌ Error creating notification:', error)
                }
            } else if (Notification.permission === 'default') {
                console.log('[Notifications] Requesting permission...')
                const permission = await this.requestPermission()
                if (permission === 'granted') {
                    try {
                        const notification = new Notification(title, {
                            body: message,
                            icon: '/favicon.ico',
                            requireInteraction: false,
                        })
                        console.log('[Notifications] ✅ Notification shown after permission granted!', notification)
                    } catch (error) {
                        console.error('[Notifications] ❌ Error creating notification:', error)
                    }
                } else {
                    console.warn('[Notifications] Permission denied or dismissed')
                }
            } else {
                console.error('[Notifications] ❌ Permission denied. User must enable in browser settings.')
                // Don't show alert every time, just log it
            }
        },

        async requestPermission() {
            if ('Notification' in window && Notification.permission === 'default') {
                const permission = await Notification.requestPermission()
                console.log('[Notifications] Permission requested, result:', permission)
                return permission
            }
            return Notification.permission
        },
    },
})

