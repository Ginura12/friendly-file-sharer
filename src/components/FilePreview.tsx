import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

export const FilePreview = ({ file }) => {
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';

  return (
    <Card className="relative">
      <CardContent className="pt-6">
        <div className="max-h-[500px] overflow-auto">
          {isImage && (
            <img 
              src={file.url} 
              alt={file.name}
              className="max-w-full h-auto mx-auto"
            />
          )}
          {isPDF && (
            <iframe
              src={file.url}
              className="w-full h-[500px]"
              title={file.name}
            />
          )}
          {!isImage && !isPDF && (
            <div className="text-center py-8">
              <p className="text-gray-500">
                Preview not available for this file type
              </p>
              <p className="text-sm text-gray-400 mt-2">
                File type: {file.type}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};