import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Camera, Trash2, KeyRound, Save, Loader2 } from "lucide-react";
import api, { formatApiErrorDetail } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/** Resize image file to a max dimension, return JPEG data URL. */
async function compressImage(file, maxDim = 256, quality = 0.82) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });
}

export default function AccountTab() {
  const { user, refresh } = useAuth();
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [profileDraft, setProfileDraft] = useState({
    bakery_name: user?.bakery_name || "",
    email: user?.email || "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [pwd, setPwd] = useState({ current_password: "", new_password: "", confirm: "" });
  const [changingPwd, setChangingPwd] = useState(false);

  const onPickAvatar = () => fileRef.current?.click();

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-select same file
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await compressImage(file);
      await api.put("/profile", { avatar_url: dataUrl });
      await refresh();
      toast.success("Profile picture updated");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeAvatar = async () => {
    setUploading(true);
    try {
      await api.put("/profile", { avatar_url: "" });
      await refresh();
      toast.success("Profile picture removed");
    } catch (err) {
      toast.error("Could not remove");
    } finally {
      setUploading(false);
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.put("/profile", {
        bakery_name: profileDraft.bakery_name,
        email: profileDraft.email,
      });
      await refresh();
      toast.success("Profile saved");
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Save failed");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwd.new_password !== pwd.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (pwd.new_password.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    setChangingPwd(true);
    try {
      await api.post("/profile/password", {
        current_password: pwd.current_password,
        new_password: pwd.new_password,
      });
      toast.success("Password changed");
      setPwd({ current_password: "", new_password: "", confirm: "" });
    } catch (err) {
      toast.error(formatApiErrorDetail(err.response?.data?.detail) || "Password change failed");
    } finally {
      setChangingPwd(false);
    }
  };

  const initials = (user?.bakery_name || user?.email || "BB").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6" data-testid="account-tab-content">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 ring-2 ring-[#FAD4D0] ring-offset-2 ring-offset-white">
          {user?.avatar_url ? <AvatarImage src={user.avatar_url} alt={user.bakery_name} /> : null}
          <AvatarFallback className="bg-[#E8A365] text-white font-semibold text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <p className="font-display text-sm font-semibold text-[#3E2723]">Profile picture</p>
          <p className="text-xs text-[#795548]">JPG or PNG — resized to 256px.</p>
          <div className="flex gap-2 mt-2">
            <Button
              type="button"
              size="sm"
              onClick={onPickAvatar}
              disabled={uploading}
              data-testid="avatar-upload-btn"
              className="rounded-full bg-[#D95A4E] hover:bg-[#C2493D] text-white h-8"
            >
              {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Camera className="h-3.5 w-3.5 mr-1" />}
              {user?.avatar_url ? "Change" : "Upload"}
            </Button>
            {user?.avatar_url && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={removeAvatar}
                disabled={uploading}
                data-testid="avatar-remove-btn"
                className="rounded-full text-[#795548] hover:bg-[#F4F0EA] h-8"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Remove
              </Button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
            data-testid="avatar-file-input"
          />
        </div>
      </div>

      <Separator className="bg-[#EAE0D5]" />

      {/* Profile info */}
      <form onSubmit={saveProfile} className="space-y-4">
        <div>
          <Label htmlFor="acct-bakery" className="text-sm font-medium text-[#3E2723]">
            Bakery name
          </Label>
          <Input
            id="acct-bakery"
            value={profileDraft.bakery_name}
            onChange={(e) => setProfileDraft((d) => ({ ...d, bakery_name: e.target.value }))}
            data-testid="account-bakery-name-input"
            className="mt-1.5 h-10 rounded-xl bg-white border-[#EAE0D5] focus-visible:ring-[#FAD4D0] focus-visible:border-[#D95A4E]"
          />
        </div>
        <div>
          <Label htmlFor="acct-email" className="text-sm font-medium text-[#3E2723]">
            Email
          </Label>
          <Input
            id="acct-email"
            type="email"
            value={profileDraft.email}
            onChange={(e) => setProfileDraft((d) => ({ ...d, email: e.target.value }))}
            data-testid="account-email-input"
            className="mt-1.5 h-10 rounded-xl bg-white border-[#EAE0D5] focus-visible:ring-[#FAD4D0] focus-visible:border-[#D95A4E]"
          />
        </div>
        <Button
          type="submit"
          disabled={savingProfile}
          data-testid="account-save-profile-btn"
          className="rounded-full bg-[#D95A4E] hover:bg-[#C2493D] text-white"
        >
          <Save className="h-4 w-4 mr-1.5" />
          {savingProfile ? "Saving…" : "Save changes"}
        </Button>
      </form>

      <Separator className="bg-[#EAE0D5]" />

      {/* Change password */}
      <form onSubmit={changePassword} className="space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] font-bold text-[#795548]">
            Change password
          </p>
        </div>
        <div>
          <Label htmlFor="pwd-current" className="text-sm font-medium text-[#3E2723]">
            Current password
          </Label>
          <Input
            id="pwd-current"
            type="password"
            value={pwd.current_password}
            onChange={(e) => setPwd((p) => ({ ...p, current_password: e.target.value }))}
            data-testid="password-current-input"
            required
            className="mt-1.5 h-10 rounded-xl bg-white border-[#EAE0D5] focus-visible:ring-[#FAD4D0] focus-visible:border-[#D95A4E]"
          />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="pwd-new" className="text-sm font-medium text-[#3E2723]">
              New password
            </Label>
            <Input
              id="pwd-new"
              type="password"
              minLength={6}
              value={pwd.new_password}
              onChange={(e) => setPwd((p) => ({ ...p, new_password: e.target.value }))}
              data-testid="password-new-input"
              required
              className="mt-1.5 h-10 rounded-xl bg-white border-[#EAE0D5] focus-visible:ring-[#FAD4D0] focus-visible:border-[#D95A4E]"
            />
          </div>
          <div>
            <Label htmlFor="pwd-confirm" className="text-sm font-medium text-[#3E2723]">
              Confirm
            </Label>
            <Input
              id="pwd-confirm"
              type="password"
              minLength={6}
              value={pwd.confirm}
              onChange={(e) => setPwd((p) => ({ ...p, confirm: e.target.value }))}
              data-testid="password-confirm-input"
              required
              className="mt-1.5 h-10 rounded-xl bg-white border-[#EAE0D5] focus-visible:ring-[#FAD4D0] focus-visible:border-[#D95A4E]"
            />
          </div>
        </div>
        <Button
          type="submit"
          disabled={changingPwd}
          data-testid="password-change-btn"
          variant="outline"
          className="rounded-full border-[#EAE0D5] bg-white hover:bg-[#F4F0EA] text-[#3E2723]"
        >
          <KeyRound className="h-4 w-4 mr-1.5" />
          {changingPwd ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}
