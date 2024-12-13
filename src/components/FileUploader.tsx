import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export const FileUploader = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    // TODO: Implement Supabase file upload
    console.log("Uploading file:", selectedFile.name);
  };

  return (
    <div className="space-y-4">
      <Input
        type="file"
        onChange={handleFileSelect}
        className="cursor-pointer"
      />
      <Button
        onClick={handleUpload}
        disabled={!selectedFile}
        className="w-full"
      >
        Upload File
      </Button>
    </div>
  );
};