"use client";

import { LinkWalletButton } from "@/app/(authenticated)/profile/web3-button";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { updateUserTitleDisplayName } from "@/lib/playfab/actions";
import { PlayFab } from "@/lib/playfab/types";
import { IAccountCookie } from "@/types/cookies";

import { zodResolver } from "@hookform/resolvers/zod";
import { Session } from "next-auth";
import { useForm } from "react-hook-form";
import * as z from "zod";

const profileFormSchema = z.object({
  username: z
    .string()
    .min(3, {
      message: "Username must be at least 3 characters.",
    })
    .max(16, {
      message: "Username must not be longer than 16 characters.",
    }),
  email: z
    .string({
      required_error: "Please select an email to display.",
    })
    .email(),
  wallet: z
    .string({
      required_error: "Please choose a primary wallet.",
    }).min(42).max(42),
  // bio: z.string().max(160).min(4).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>

export type ProfileFormProps = {
  account: PlayFab.Client.Account.AccountInfo;
  session: Session;
  accountCookie: IAccountCookie;
}
export const ProfileForm = ({ account, session, accountCookie }: ProfileFormProps) => {
  const emails = [
    account.PrivateInfo?.Email,
    account.GoogleInfo?.GoogleEmail,
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i) as string[];

  const defaultValues: Partial<ProfileFormValues> = {
    username: account.TitleInfo.DisplayName,
    email: account.PrivateInfo?.Email,
    wallet: account.CustomIdInfo?.CustomId,
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });

  const onSubmit = async (data: ProfileFormValues) => {
    await updateUserTitleDisplayName(data.username,
      (
        session as any
      ).playFab.SessionTicket,
    );
    toast({

      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">{JSON.stringify(data, null, 2)}</code>
        </pre>
      ),
    });
  };
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Not Set..." {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name. It can be your real name or a
                pseudonym. You can only change this once every 30 days.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Email</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a verified email to display" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {emails.map((email) => (
                    <SelectItem key={email} value={email}>{email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormDescription>
                Your verified email addresses are managed by your connected accounts
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="wallet"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Primary Wallet</FormLabel>
              <div className="flex">
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a connected wallet" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {account.CustomIdInfo?.CustomId && (
                      <SelectItem value={account.CustomIdInfo.CustomId}>{account.CustomIdInfo.CustomId}</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <LinkWalletButton
                  disabled={!!account.CustomIdInfo?.CustomId}
                  session={session}
                  accountCookie={accountCookie}
                  className="ml-2"
                />
              </div>
              <FormDescription>
                Connecting your wallet allows you to buy, sell, and trade NFTs.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/*<FormField
         control={form.control}
         name="bio"
         disabled
         render={({ field }) => (
         <FormItem>
         <FormLabel>Bio</FormLabel>
         <FormControl>
         <Textarea
         placeholder="Tell us a little bit about yourself"
         className="resize-none"
         {...field}
         />
         </FormControl>
         <FormDescription>
         You can <span>@mention</span> other users and organizations to
         link to them.
         </FormDescription>
         <FormMessage />
         </FormItem>
         )}
         />*/}
        <Button
          disabled={!form.formState.dirtyFields.username || !form.formState.isValid}
          type="submit"
        >
          Update profile
        </Button>
      </form>
    </Form>
  );
};
