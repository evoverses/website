"use client";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@workspace/ui/components/drawer";
import { ComponentProps } from "react";
import { useMediaQuery } from "usehooks-ts";

const SmartDrawer = (props: ComponentProps<typeof Drawer>) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  if (isDesktop) {
    return <Dialog {...props} />;
  }
  return <Drawer {...props} />;
};
SmartDrawer.displayName = "SmartDrawer";

const SmartDrawerTrigger = (props: ComponentProps<typeof DrawerTrigger>) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  if (isDesktop) {
    return <DialogTrigger {...props} />;
  }
  return <DrawerTrigger {...props} />;
};
SmartDrawerTrigger.displayName = "SmartDrawerTrigger";

const SmartDrawerHeader = (props: ComponentProps<typeof DrawerHeader>) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  if (isDesktop) {
    return <DialogHeader {...props} />;
  }
  return <DrawerHeader {...props} />;
};
SmartDrawerHeader.displayName = "SmartDrawerHeader";

const SmartDrawerTitle = (props: ComponentProps<typeof DrawerTitle>) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  if (isDesktop) {
    return <DialogTitle {...props} />;
  }
  return <DrawerTitle {...props} />;
};
SmartDrawerTitle.displayName = "SmartDrawerTitle";

const SmartDrawerDescription = (props: ComponentProps<typeof DrawerDescription>) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  if (isDesktop) {
    return <DialogDescription {...props} />;
  }
  return <DrawerDescription {...props} />;
};
SmartDrawerDescription.displayName = "SmartDrawerDescription";

const SmartDrawerContent = (props: ComponentProps<typeof DrawerContent>) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  if (isDesktop) {
    return <DialogContent {...props} />;
  }
  return <DrawerContent {...props} />;
};
SmartDrawerContent.displayName = "SmartDrawerContent";

const SmartDrawerFooter = (props: ComponentProps<typeof DrawerFooter>) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  if (isDesktop) {
    return <DialogFooter {...props} />;
  }
  return <DrawerFooter {...props} />;
};
SmartDrawerFooter.displayName = "SmartDrawerFooter";

const SmartDrawerClose = (props: ComponentProps<typeof DrawerClose>) => {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  if (isDesktop) {
    return <DialogClose {...props} />;
  }
  return <DrawerClose {...props} />;
};
SmartDrawerClose.displayName = "SmartDrawerClose";

export {
  SmartDrawer,
  SmartDrawerTrigger,
  SmartDrawerHeader,
  SmartDrawerTitle,
  SmartDrawerDescription,
  SmartDrawerContent,
  SmartDrawerFooter,
  SmartDrawerClose,
};
