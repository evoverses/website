"use client";

import { updateUserReadOnlyDataAction } from "@/app/(authenticated)/profile/_components/actions";
import { LinkWalletButton } from "@/app/(authenticated)/profile/_components/web3-button";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateUserTitleDisplayName } from "@/lib/playfab/actions";
import { getUserReadOnlyData } from "@/lib/playfab/helpers";
import { PlayFab } from "@/lib/playfab/types";
import { IAccountCookie } from "@/types/cookies";

import { zodResolver } from "@hookform/resolvers/zod";
import { Address } from "abitype";
import { Session } from "next-auth";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";
import InfoResultPayload = PlayFab.Client.Account.Responses.InfoResultPayload;

const profileFormSchema = z.object({
  username: z
    .string({
      description: "This is your public display name. It can be your real name or a pseudonym. You can only change this once every 30 days.",
    })
    .min(3, { message: "Username must be at least 3 characters." })
    .max(16, { message: "Username must not be longer than 16 characters." }),
  email: z
    .string({ description: "Your verified email addresses are managed by your connected accounts" })
    .email({ message: "Email must be a valid email address." })
    .optional(),
  wallet: z
    .string({ description: "Connecting your wallet allows you to buy, sell, and trade NFTs." })
    .min(42, { message: "Wallet address must be 42 characters long in the form of 0x..." })
    .max(42, { message: "Wallet address must be 42 characters long in the form of 0x..." })
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>

export type ProfileFormProps = {
  account: PlayFab.Client.Account.AccountInfo;
  session: Session;
  accountCookie: IAccountCookie;
  combined: InfoResultPayload
}
export const ProfileForm = ({ account, session, accountCookie, combined }: ProfileFormProps) => {
  const readOnlyData = getUserReadOnlyData(combined);
  const emails = [
    account.PrivateInfo?.Email,
    account.GoogleInfo?.GoogleEmail,
  ].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i) as string[];

  const defaultValues: Partial<ProfileFormValues> = {
    username: account.TitleInfo.DisplayName,
    email: account.PrivateInfo?.Email,
    wallet: readOnlyData.wallets.primary,
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });
  const { isValid, dirtyFields, isDirty } = form.formState;
  const onSubmit = async (data: ProfileFormValues) => {
    if (data.username !== account.TitleInfo.DisplayName) {
      await updateUserTitleDisplayName(data.username, session.playFab.SessionTicket);
    }
    if (data.wallet !== readOnlyData.wallets.primary) {
      await updateUserReadOnlyDataAction(account.PlayFabId, {
        ...readOnlyData,
        wallets: {
          ...readOnlyData.wallets,
          primary: data.wallet as Address,
        },
      });
    }
    toast.success("Your profile has been updated.");
    form.reset();
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
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={emails.length === 0}
                {...field}
              >
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
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={readOnlyData.wallets.connected.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={readOnlyData.wallets.connected.length === 0
                          ? "You have no connected wallets"
                          : "Select a connected wallet"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {readOnlyData.wallets.connected.map(wallet => (
                      <SelectItem key={wallet} value={wallet}>{wallet}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <LinkWalletButton
                  playFabId={account.PlayFabId}
                  accountCookie={accountCookie}
                  readOnlyData={readOnlyData}
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
        <Button
          disabled={!isValid || !isDirty}
          type="submit"
        >
          Update profile
        </Button>
      </form>
    </Form>
  );
};
