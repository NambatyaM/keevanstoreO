// ============================================================
// Event Check-In Page
// ============================================================
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  QrCode,
  CheckCircle2,
  Search,
  ArrowLeft,
  Users,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import type { Ticket } from "@/types";

const mockTickets: Ticket[] = [
  {
    id: "ticket-1",
    orderId: "order-4",
    productId: "prod-5",
    buyerEmail: "alice@example.com",
    buyerName: "Alice Nalubega",
    qrCode: "QR-ALICE-001",
    checkedIn: false,
    checkedInAt: null,
    createdAt: "2026-02-27T09:15:00Z",
  },
  {
    id: "ticket-2",
    orderId: "order-7",
    productId: "prod-5",
    buyerEmail: "robert@example.com",
    buyerName: "Robert Mugisha",
    qrCode: "QR-ROBERT-002",
    checkedIn: true,
    checkedInAt: "2026-04-15T19:30:00Z",
    createdAt: "2026-02-25T12:05:00Z",
  },
  {
    id: "ticket-3",
    orderId: "order-9",
    productId: "prod-5",
    buyerEmail: "samuel@example.com",
    buyerName: "Samuel Kato",
    qrCode: "QR-SAMUEL-003",
    checkedIn: false,
    checkedInAt: null,
    createdAt: "2026-02-20T15:05:00Z",
  },
];

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [search, setSearch] = useState("");
  const [eventName, setEventName] = useState("Kampala Cultural Night");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, fetch event and tickets from API
    setTimeout(() => setLoading(false), 500);
  }, [eventId]);

  const filteredTickets = tickets.filter(
    (t) =>
      t.buyerName.toLowerCase().includes(search.toLowerCase()) ||
      t.buyerEmail.toLowerCase().includes(search.toLowerCase()) ||
      t.qrCode.toLowerCase().includes(search.toLowerCase())
  );

  const checkedInCount = tickets.filter((t) => t.checkedIn).length;
  const totalCount = tickets.length;

  const handleCheckIn = (ticketId: string) => {
    setTickets(
      tickets.map((t) =>
        t.id === ticketId
          ? { ...t, checkedIn: true, checkedInAt: new Date().toISOString() }
          : t
      )
    );
    toast.success("Attendee checked in successfully! ✅");
  };

  const handleUndoCheckIn = (ticketId: string) => {
    setTickets(
      tickets.map((t) =>
        t.id === ticketId ? { ...t, checkedIn: false, checkedInAt: null } : t
      )
    );
    toast.info("Check-in undone");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push("/events")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-semibold">Check-In</h2>
          <p className="text-sm text-muted-foreground">{eventName}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{totalCount}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-900">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{checkedInCount}</p>
            <p className="text-xs text-muted-foreground">Checked In</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {totalCount - checkedInCount}
            </p>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or QR code..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tickets List */}
      <div className="space-y-3">
        {filteredTickets.map((ticket) => (
          <Card key={ticket.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{ticket.buyerName}</p>
                  {ticket.checkedIn ? (
                    <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">
                      <CheckCircle2 className="h-3 w-3 mr-0.5" />
                      Checked In
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px]">
                      <QrCode className="h-3 w-3 mr-0.5" />
                      Pending
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{ticket.buyerEmail}</p>
                {ticket.checkedInAt && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Checked in: {new Date(ticket.checkedInAt).toLocaleString()}
                  </p>
                )}
              </div>

              {ticket.checkedIn ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleUndoCheckIn(ticket.id)}
                  className="text-muted-foreground"
                >
                  Undo
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => handleCheckIn(ticket.id)}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Check In
                </Button>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredTickets.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              {search ? "No matching attendees found" : "No tickets sold yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
