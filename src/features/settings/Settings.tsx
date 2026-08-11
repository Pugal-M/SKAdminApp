import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getSettings } from "./api/getSettings";
import { updateSetting } from "./api/updateSetting";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";
import { useState } from "react";
import { useAuth } from "../../providers/AuthProvider";

export function Settings() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const [pendingSettingChange, setPendingSettingChange] = useState<{key: string, value: string} | null>(null);

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: getSettings,
  });

  const mutation = useMutation({
    mutationFn: ({ key, value }: { key: string, value: any }) => 
      updateSetting(key, value, user?.id || ""),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      setEditingKey(null);
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
      </div>
    );
  }

  // Group settings by category
  const groupedSettings = settings?.reduce((acc: any, setting) => {
    if (!acc[setting.category]) acc[setting.category] = [];
    acc[setting.category].push(setting);
    return acc;
  }, {});

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Settings</h2>
        <p className="text-muted-foreground mt-2">
          Configure global application parameters.
        </p>
      </div>

      <div className="space-y-6">
        {groupedSettings && Object.keys(groupedSettings).map(category => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="capitalize">{category.replace(/_/g, ' ')} Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {groupedSettings[category].map((setting: any) => (
                <div key={setting.key} className="flex flex-col space-y-2 border-b pb-4 last:border-0 last:pb-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-sm font-medium">{setting.key}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{setting.description || "No description provided."}</p>
                    </div>
                    {editingKey !== setting.key ? (
                      <Button variant="outline" size="sm" onClick={() => {
                        setEditingKey(setting.key);
                        setEditValue(typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value));
                      }}>
                        Edit
                      </Button>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => setEditingKey(null)}>Cancel</Button>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            setPendingSettingChange({ key: setting.key, value: editValue });
                          }}
                          disabled={mutation.isPending}
                        >
                          {mutation.isPending ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    )}
                  </div>
                  {editingKey === setting.key ? (
                    <Input 
                      value={editValue} 
                      onChange={(e) => setEditValue(e.target.value)} 
                      className="mt-2 font-mono text-sm"
                    />
                  ) : (
                    <div className="mt-2 bg-muted p-2 rounded font-mono text-sm truncate">
                      {typeof setting.value === 'object' ? JSON.stringify(setting.value) : String(setting.value)}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        {(!groupedSettings || Object.keys(groupedSettings).length === 0) && (
          <div className="text-center text-muted-foreground py-8">
            No system settings found.
          </div>
        )}
      </div>

      <AlertDialog open={pendingSettingChange !== null} onOpenChange={(open) => !open && setPendingSettingChange(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change System Setting?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to change the '{pendingSettingChange?.key}' setting? This may affect the entire application behavior.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (pendingSettingChange) {
                  mutation.mutate(pendingSettingChange);
                  setPendingSettingChange(null);
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
