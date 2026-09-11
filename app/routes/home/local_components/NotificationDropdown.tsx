import { useNotifications } from "~/custom-hooks/context-hooks"

export default function NotificationDropdown() {
  const {
    unreadCount,
    setNotificationDropdownStatus,
    notifications,
    markAsRead,
    markAllAsRead
  } = useNotifications()
  return (
    <div className="absolute right-[-40px] md:right-0 mt-3 w-80 md:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-100 backdrop-blur-xl">
      <section className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/80">
        <article className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">
            Notifications
          </h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-bold bg-indigo-500/20 text-indigo-400 rounded-full border border-indigo-500/30">
              {unreadCount} new
            </span>
          )}
        </article>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="text-slate-400 hover:text-white text-sm font-medium cursor-pointer"
          >
            Mark all as read.
          </button>
        )}
        <button
          onClick={() => setNotificationDropdownStatus(false)}
          className="text-slate-400 hover:text-white text-sm font-medium cursor-pointer"
        >
          ✕
        </button>
      </section>

      <section className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            No notifications yet
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => {
                if (!notif.was_read) markAsRead(notif.id)
              }}
              className={`p-4 transition-colors cursor-pointer flex flex-col gap-1 ${
                notif.was_read
                  ? "bg-slate-900/40 opacity-75"
                  : "bg-slate-800/50 hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  {new Date(notif.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </span>
              </div>
              <p className="text-xs text-slate-300 line-clamp-2">
                {notif.message}
              </p>
              <h3 className="text-xs text-blue-800 font-semibold">
                {notif.type}
              </h3>
            </div>
          ))
        )}
      </section>
    </div>
  )
}
