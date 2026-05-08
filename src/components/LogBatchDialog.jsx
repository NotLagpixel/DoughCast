import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import api, { formatApiErrorDetail } from "@/lib/api";
import { toast } from "sonner";

export const LogBatchDialog = ({ open, onOpenChange, onSaved, initialDate }) => {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    date: initialDate || today,
    baked: "",
    sold: "",
    note: "",
  });
  const [saving, setSaving] = useState(false);

  const update = (key) => (e) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const baked = Number(form.baked);
      const sold = Number(form.sold);
      if (Number.isNaN(baked) || Number.isNaN(sold)) {
        toast.error("Please enter numeric values");
        return;
      }
      await api.post("/batches", {
        date: form.date,
        baked,
        sold,
        note: form.note || "",
      });
      toast.success("Batch saved");
      onSaved?.();
      onOpenChange(false);
      setForm({ date: today, baked: "", sold: "", note: "" });
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-testid="log-batch-dialog"
        className="sm:max-w-lg rounded-3xl border-[#EAE0D5] bg-[#FDFBF7]"
      >
        <DialogHeader>
          <DialogTitle className="font-display text-2xl text-[#3E2723]">
            Log a batch
          </DialogTitle>
          <DialogDescription className="text-[#795548]">
            Tell DoughCast how today (or any past day) went.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4 mt-2">
          <div>
            <Label htmlFor="batch-date" className="text-sm text-[#795548] mb-1.5 block">
              Date
            </Label>
            <Input
              id="batch-date"
              type="date"
              max={today}
              value={form.date}
              onChange={update("date")}
              data-testid="batch-date-input"
              className="h-11 rounded-xl bg-white border-[#EAE0D5] focus-visible:ring-[#FAD4D0] focus-visible:border-[#D95A4E] text-[#3E2723]"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="batch-baked" className="text-sm text-[#795548] mb-1.5 block">
                Baked
              </Label>
              <Input
                id="batch-baked"
                type="number"
                min="0"
                placeholder="e.g. 300"
                value={form.baked}
                onChange={update("baked")}
                data-testid="batch-baked-input"
                className="h-11 rounded-xl bg-white border-[#EAE0D5] focus-visible:ring-[#FAD4D0] focus-visible:border-[#D95A4E] text-[#3E2723]"
                required
              />
            </div>
            <div>
              <Label htmlFor="batch-sold" className="text-sm text-[#795548] mb-1.5 block">
                Sold
              </Label>
              <Input
                id="batch-sold"
                type="number"
                min="0"
                placeholder="e.g. 285"
                value={form.sold}
                onChange={update("sold")}
                data-testid="batch-sold-input"
                className="h-11 rounded-xl bg-white border-[#EAE0D5] focus-visible:ring-[#FAD4D0] focus-visible:border-[#D95A4E] text-[#3E2723]"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="batch-note" className="text-sm text-[#795548] mb-1.5 block">
              Note (optional)
            </Label>
            <Input
              id="batch-note"
              placeholder="School field trip, rainstorm, etc."
              value={form.note}
              onChange={update("note")}
              data-testid="batch-note-input"
              className="h-11 rounded-xl bg-white border-[#EAE0D5] focus-visible:ring-[#FAD4D0] focus-visible:border-[#D95A4E] text-[#3E2723]"
            />
          </div>

          <DialogFooter className="pt-3 sm:space-x-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              data-testid="batch-cancel-btn"
              className="rounded-full text-[#795548] hover:bg-[#F4F0EA]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              data-testid="batch-save-btn"
              className="rounded-full bg-[#D95A4E] hover:bg-[#C2493D] text-white"
            >
              {saving ? "Saving…" : "Save batch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default LogBatchDialog;
