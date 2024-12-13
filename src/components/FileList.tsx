import { Card, CardContent } from "@/components/ui/card";

export const FileList = () => {
  // TODO: Implement Supabase real-time file listing
  const files = []; // This will be populated from Supabase

  return (
    <Card>
      <CardContent className="pt-6">
        <h3 className="text-lg font-semibold mb-4">Uploaded Files</h3>
        {files.length === 0 ? (
          <p className="text-gray-500 text-center">No files uploaded yet</p>
        ) : (
          <ul className="space-y-2">
            {files.map((file: any) => (
              <li key={file.id} className="p-2 hover:bg-gray-50 rounded-lg">
                {file.name}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};