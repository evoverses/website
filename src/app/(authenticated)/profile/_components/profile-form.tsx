"use client";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useConnectedSiweWallets, useProfiles, useSmartWalletAdmin } from "@/thirdweb/hooks/use-profiles";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

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

export const ProfileForm = () => {
  const { profiles } = useProfiles();
  const eoaWallets = useConnectedSiweWallets();
  const adminWallet = useSmartWalletAdmin();
  const emails = profiles.map(p => p.details.email).filter(Boolean).filter((v, i, a) => a.indexOf(v) === i) as string[];
  const displayName = "";
  const defaultValues: Partial<ProfileFormValues> = {
    username: displayName,
    email: emails.length > 0 ? emails[0] : "",
    wallet: adminWallet,
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
    mode: "onChange",
  });
  const { isValid, dirtyFields, isDirty } = form.formState;
  const onSubmit = async (data: ProfileFormValues) => {
    //if (data.username !== displayName) {
    //  await updateUserTitleDisplayName(data.username, session.playFab.SessionTicket);
    //}
    //if (data.wallet !== readOnlyData.wallets.primary) {
    //  await updateUserReadOnlyDataAction(account.PlayFabId, {
    //    ...readOnlyData,
    //    wallets: {
    //      ...readOnlyData.wallets,
    //      primary: data.wallet as Address,
    //    },
    //  });
    //}
    //toast.success("Your profile has been updated.");
    //form.reset();
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
                  disabled={eoaWallets.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={eoaWallets.length === 0
                          ? "You have no connected wallets"
                          : "Select a connected wallet"}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {eoaWallets.map(w => w.getAccount()?.address).filter(Boolean).map(wallet => (
                      <SelectItem key={wallet} value={wallet!}>{wallet}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {/*<LinkWalletButton*/}
                {/*  playFabId={account.PlayFabId}*/}
                {/*  accountCookie={accountCookie}*/}
                {/*  readOnlyData={readOnlyData}*/}
                {/*  className="ml-2"*/}
                {/*/>*/}
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
