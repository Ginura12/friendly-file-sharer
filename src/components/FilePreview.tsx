import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

export const FilePreview = ({ file }) => {
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';

  return (
    <Card className="relative transition-all duration-300 hover:shadow-xl bg-white/80 backdrop-blur-sm border-t border-white/60 rounded-xl animate-scale-in">
      <CardContent className="pt-6">
        <div className="max-h-[500px] overflow-auto">
          {isImage && (
            <img 
              src={file.url} 
              alt={file.name}
              className="max-w-full h-auto mx-auto transition-all duration-300 hover:scale-105"
            />
          )}
          {isPDF && (
            <iframe
              src={file.url}
              className="w-full h-[500px] transition-all duration-300"
              title={file.name}
            />
          )}
          {!isImage && !isPDF && (
            <div className="text-center py-8 animate-fade-in">
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