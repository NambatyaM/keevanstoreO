// ============================================================
// Events Page — List events with links to check-in
// ============================================================
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Users, QrCode, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CurrencyDisplay } from "@/components/shared/currency-display";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import type { Product } from "@/types";

export default function EventsPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const params = new URLSearchParams();
        if (user?.id) params.set("creator_id", user.id);
        params.set("type", "event");

        const res = await fetch(`/api/products?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setEvents(data.data || []);
        }
      } catch {
        // Use empty array
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, [user?.id]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-6 bg-muted rounded w-48 mb-3" />
              <div className="h-4 bg-muted rounded w-32 mb-2" />
              <div className="h-4 bg-muted rounded w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Events</h2>
        <p className="text-sm text-muted-foreground">
          Manage your events and check in attendees
        </p>
      </div>

      {events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event) => (
            <Card key={event.id}>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {event.title}
                      </h3>
                      <Badge variant={event.status === "active" ? "default" : "destructive"}>
                        {event.status}
                      </Badge>
                    </div>

                    {event.venue && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.venue}
                      </div>
                    )}

                    {event.eventDate && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(event.eventDate), "MMM d, yyyy 'at' h:mm a")}
                      </div>
                    )}

                    {event.capacity && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        {event.ticketsSold} / {event.capacity} tickets sold
                      </div>
                    )}

                    <CurrencyDisplay amount={event.price} size="md" />
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white"
                      asChild
                    >
                      <Link href={`/events/${event.id}/check-in`}>
                        <QrCode className="h-4 w-4 mr-1.5" />
                        Check-In
                      </Link>
                    </Button>
                    <Button variant="outline" className="flex-1 sm:flex-initial" asChild>
                      <Link href={`/products/${event.id}/edit`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>

                {/* Capacity Bar */}
                {event.capacity && (
                  <div className="mt-4">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (event.ticketsSold / event.capacity) * 100)}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{event.ticketsSold} sold</span>
                      <span>{event.capacity - event.ticketsSold} remaining</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground">
              No events yet
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Create an event ticket to start selling and managing check-ins
            </p>
            <Button
              className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
              asChild
            >
              <Link href="/products/new">
                Create Event
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
