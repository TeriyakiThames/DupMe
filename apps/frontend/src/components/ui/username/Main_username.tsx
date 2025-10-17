"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import { Button } from "@/components/ui/username/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/username/form"
import { Input } from "@/components/ui/username/input"

import { useAuth } from '@/hooks/useAuth';

const FormSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
});

export function InputForm() {
  const { user, updateProfile, isLoading, error, clearError } = useAuth();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: user?.username || "",
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    await updateProfile({ username: data.username });
    // Optionally show a toast or success message here
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-2/3 space-y-6">
        {error && (
          <div className="mb-2 p-2 bg-red-100 border border-red-300 rounded text-red-800 text-sm">
            {error}
            <button onClick={clearError} className="ml-2 text-red-600 hover:text-red-800">×</button>
          </div>
        )}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter your username" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </form>
    </Form>
  );
}
