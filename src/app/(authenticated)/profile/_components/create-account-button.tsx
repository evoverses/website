"use client";

import { createAccountAction } from "@/app/(authenticated)/profile/_components/actions";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Icons } from "@/components/ui/icons";
import { toast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

const CreateAccountButton = ({ accountId }: { accountId: string }) => {
  const router = useRouter();
  const form = useForm({
    mode: "onSubmit",
  });

  const onClick = async () => {
    try {
      await createAccountAction(accountId);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      toast({
        title: "Success",
        description: "Your account has been created!",
      });
      router.refresh();
    } catch (e) {
      toast({
        title: "Error",
        description: `There was an error creating your account. ${e}`,
        variant: "destructive",
      });
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

export default CreateAccountButton;
