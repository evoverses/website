"use client";

import { createAccountAction, updateUserReadOnlyDataAction } from "@/app/(authenticated)/profile/_components/actions";
import { UserReadOnlyData } from "@/lib/playfab/helpers";
import { Button } from "@workspace/ui/components/button";
import { Form } from "@workspace/ui/components/form";
import { Icons } from "@workspace/ui/components/icons";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { FaSpinner } from "react-icons/fa";
import { toast } from "sonner";
import { Address } from "thirdweb";

type CreateAccountButtonProps = {
  accountId: string;
  address: Address
  userReadOnlyData: UserReadOnlyData;
  created?: boolean;
}

export const CreateAccountButton = ({ accountId, address, userReadOnlyData }: CreateAccountButtonProps) => {
  const router = useRouter();
  const form = useForm({
    mode: "onSubmit",
  });

  const onClick = async () => {
    try {
      await createAccountAction(accountId);
      const newReadOnlyData = { ...userReadOnlyData, wallets: { ...userReadOnlyData.wallets, managed: address } };
      await updateUserReadOnlyDataAction(accountId, newReadOnlyData);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      toast.success("Your account has been created!");
      router.refresh();
    } catch (e) {
      toast.error(`There was an error creating your account. ${e}`);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onClick)}>
        <Button type="submit" variant="warning" className="!pl-4 ml-4" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? <Icons.spinner className="w-4 h-4" /> : "Create"}
        </Button>
      </form>
    </Form>
  );
};

export const SmartWalletUpdater = ({ accountId, address, userReadOnlyData, created }: CreateAccountButtonProps) => {
  useEffect(() => {
    if (created && userReadOnlyData.wallets.managed !== address) {
      const newReadOnlyData = { ...userReadOnlyData, wallets: { ...userReadOnlyData.wallets, managed: address } };
      updateUserReadOnlyDataAction(accountId, newReadOnlyData).then(() => {
        toast.success("Your account has been updated!");
      }).catch((e) => {
        toast.error(`There was an error updating your account. ${e}`);
      });
    }
  }, [ created, userReadOnlyData, accountId, address ]);

  return (
    <div className="flex justify-center items-center space-x-4">
      <span>Updating account</span>
      <FaSpinner className="w-10 h-10 animate-spin" />
    </div>
  );
};

export default CreateAccountButton;
