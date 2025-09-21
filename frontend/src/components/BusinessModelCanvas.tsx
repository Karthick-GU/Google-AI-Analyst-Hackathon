import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  X,
  Edit3,
  Check,
  AlertCircle,
  Handshake,
  CheckCircle,
  Building2,
  Lightbulb,
  MessageCircle,
  Truck,
  Users,
  FileText,
  DollarSign,
  ArrowRight,
} from "lucide-react";

interface BMCBlock {
  id: string;
  title: string;
  items: string[];
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

const initialBMCData: BMCBlock[] = [
  {
    id: "key-partners",
    title: "Key Partners",
    items: [],
    color: "bg-sky-200 border-sky-300",
    icon: Handshake,
  },
  {
    id: "key-activities",
    title: "Key Activities",
    items: [],
    color: "bg-sky-200 border-sky-300",
    icon: CheckCircle,
  },
  {
    id: "key-resources",
    title: "Key Resources",
    items: [],
    color: "bg-sky-200 border-sky-300",
    icon: Building2,
  },
  {
    id: "value-propositions",
    title: "Value Propositions",
    items: [],
    color: "bg-orange-300 border-orange-400",
    icon: Lightbulb,
  },
  {
    id: "customer-relationships",
    title: "Customer Relationships",
    items: [],
    color: "bg-amber-300 border-amber-400",
    icon: MessageCircle,
  },
  {
    id: "channels",
    title: "Channels",
    items: [],
    color: "bg-amber-300 border-amber-400",
    icon: Truck,
  },
  {
    id: "customer-segments",
    title: "Customer Segments",
    items: [],
    color: "bg-amber-300 border-amber-400",
    icon: Users,
  },
  {
    id: "cost-structure",
    title: "Cost Structure",
    items: [],
    color: "bg-green-300 border-green-400",
    icon: FileText,
  },
  {
    id: "revenue-streams",
    title: "Revenue Streams",
    items: [],
    color: "bg-green-300 border-green-400",
    icon: DollarSign,
  },
];

interface BusinessModelCanvasProps {
  isApproved?: boolean;
  onApprove?: () => void;
}

const BusinessModelCanvas: React.FC<BusinessModelCanvasProps> = ({
  isApproved = false,
  onApprove,
}) => {
  const { projectId } = useParams();
  const [bmcData, setBmcData] = useState<BMCBlock[]>(initialBMCData);
  const [hasHypotheses, setHasHypotheses] = useState(false);
  const [actuallyApproved, setActuallyApproved] = useState(isApproved);

  const mapApiToBMCBlock = (apiData: any): BMCBlock[] => {
    // Create a deep copy to avoid mutating the original
    const sample = initialBMCData.map((block) => ({
      ...block,
      items: apiData[block.id] || [],
    }));
    return sample;
  };

  // Load BMC data and check for hypotheses from localStorage based on project ID
  useEffect(() => {
    if (projectId) {
      try {
        // Load BMC data
        const storedBMCDataList = localStorage.getItem("bmcDataList");
        if (storedBMCDataList) {
          const bmcDataList = JSON.parse(storedBMCDataList);
          const bmcEntry = bmcDataList.find(
            (entry: any) => entry.projectId.toString() === projectId
          );

          if (bmcEntry && bmcEntry.bmcData) {
            setBmcData(mapApiToBMCBlock(bmcEntry.bmcData));
          } else {
            setBmcData(
              initialBMCData.map((block) => ({ ...block, items: [] }))
            );
          }
        } else {
          setBmcData(initialBMCData.map((block) => ({ ...block, items: [] })));
        }

        // Check for existing hypotheses
        const storedHypothesesList = localStorage.getItem("hypothesesList");
        if (storedHypothesesList) {
          try {
            const hypothesesList = JSON.parse(storedHypothesesList);
            const hypothesesEntry = hypothesesList.find(
              (entry: any) => entry.projectId.toString() === projectId
            );

            if (
              hypothesesEntry &&
              hypothesesEntry.hypotheses &&
              hypothesesEntry.hypotheses.length > 0
            ) {
              setHasHypotheses(true);
              setActuallyApproved(true); // Auto-approve if hypotheses exist
            } else {
              setHasHypotheses(false);
              setActuallyApproved(isApproved);
            }
          } catch (error) {
            console.error("Error parsing hypotheses:", error);
            setHasHypotheses(false);
            setActuallyApproved(isApproved);
          }
        } else {
          setHasHypotheses(false);
          setActuallyApproved(isApproved);
        }
      } catch (error) {
        console.error("Error loading data from localStorage:", error);
        setBmcData(initialBMCData.map((block) => ({ ...block, items: [] })));
        setHasHypotheses(false);
        setActuallyApproved(isApproved);
      }
    }
  }, [projectId, isApproved]);
  const [editingBlock, setEditingBlock] = useState<string | null>(null);
  const [newItem, setNewItem] = useState("");

  // Helper function to save BMC data to localStorage
  const saveBmcDataToLocalStorage = (updatedBmcData: BMCBlock[]) => {
    try {
      const storedBMCDataList = localStorage.getItem("bmcDataList");
      let bmcDataList: any[] = [];

      if (storedBMCDataList) {
        bmcDataList = JSON.parse(storedBMCDataList);
      }

      // Convert BMC blocks back to API format for storage
      const bmcDataForStorage: any = {};
      updatedBmcData.forEach((block) => {
        bmcDataForStorage[block.id] = block.items;
      });

      // Find and update the entry for this project
      const projectIndex = bmcDataList.findIndex(
        (entry) => entry.projectId.toString() === projectId
      );

      if (projectIndex !== -1) {
        bmcDataList[projectIndex].bmcData = bmcDataForStorage;
      } else {
        bmcDataList.push({
          bmcData: bmcDataForStorage,
          projectId: parseInt(projectId!),
        });
      }

      localStorage.setItem("bmcDataList", JSON.stringify(bmcDataList));
    } catch (error) {
      console.error("Error saving BMC data to localStorage:", error);
    }
  };

  const addItem = (blockId: string) => {
    if (newItem.trim()) {
      setBmcData((prev) => {
        const updatedData = prev.map((block) =>
          block.id === blockId
            ? { ...block, items: [...block.items, newItem.trim()] }
            : block
        );
        saveBmcDataToLocalStorage(updatedData);
        return updatedData;
      });
      setNewItem("");
      setEditingBlock(null);
    }
  };

  const removeItem = (blockId: string, itemIndex: number) => {
    setBmcData((prev) => {
      const updatedData = prev.map((block) =>
        block.id === blockId
          ? { ...block, items: block.items.filter((_, i) => i !== itemIndex) }
          : block
      );
      saveBmcDataToLocalStorage(updatedData);
      return updatedData;
    });
  };

  const editItem = (blockId: string, itemIndex: number, newValue: string) => {
    setBmcData((prev) => {
      const updatedData = prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              items: block.items.map((item, i) =>
                i === itemIndex ? newValue : item
              ),
            }
          : block
      );
      saveBmcDataToLocalStorage(updatedData);
      return updatedData;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Business Model Canvas</h2>
          <p className="text-muted-foreground">
            AI-generated draft based on your project details
          </p>
        </div>
        {!actuallyApproved && (
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="gap-2">
              <AlertCircle className="h-3 w-3" />
              Draft - Pending Approval
            </Badge>
            <Button onClick={onApprove} className="gap-2">
              <Check className="h-4 w-4" />
              Approve BMC
            </Button>
          </div>
        )}
        {actuallyApproved && (
          <div className="flex items-center gap-3">
            <Badge variant="default" className="gap-2">
              <Check className="h-3 w-3" />
              Approved
            </Badge>
            {hasHypotheses && (
              <Button asChild variant="outline" className="gap-2">
                <Link to={`/project/${projectId}/hypotheses`}>
                  View Hypotheses
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        )}
      </div>

      {/* BMC Grid */}
      <div className="grid grid-cols-5 grid-rows-3 gap-4 min-h-[600px]">
        {/* Key Partners - Left column, spans 2 rows */}
        <div className="row-span-2">
          <BMCBlockComponent
            block={bmcData[0]}
            isEditing={editingBlock === bmcData[0].id}
            onEdit={setEditingBlock}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onEditItem={editItem}
            newItem={newItem}
            setNewItem={setNewItem}
            isApproved={actuallyApproved}
          />
        </div>

        {/* Key Activities - Second column, top row */}
        <BMCBlockComponent
          block={bmcData[1]}
          isEditing={editingBlock === bmcData[1].id}
          onEdit={setEditingBlock}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onEditItem={editItem}
          newItem={newItem}
          setNewItem={setNewItem}
          isApproved={actuallyApproved}
        />

        {/* Value Propositions - Center column, spans 2 rows */}
        <div className="row-span-2">
          <BMCBlockComponent
            block={bmcData[3]}
            isEditing={editingBlock === bmcData[3].id}
            onEdit={setEditingBlock}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onEditItem={editItem}
            newItem={newItem}
            setNewItem={setNewItem}
            isApproved={actuallyApproved}
          />
        </div>

        {/* Customer Relationships - Fourth column, top row */}
        <BMCBlockComponent
          block={bmcData[4]}
          isEditing={editingBlock === bmcData[4].id}
          onEdit={setEditingBlock}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onEditItem={editItem}
          newItem={newItem}
          setNewItem={setNewItem}
          isApproved={actuallyApproved}
        />

        {/* Customer Segments - Right column, spans 2 rows */}
        <div className="row-span-2">
          <BMCBlockComponent
            block={bmcData[6]}
            isEditing={editingBlock === bmcData[6].id}
            onEdit={setEditingBlock}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onEditItem={editItem}
            newItem={newItem}
            setNewItem={setNewItem}
            isApproved={actuallyApproved}
          />
        </div>

        {/* Key Resources - Second column, bottom row */}
        <BMCBlockComponent
          block={bmcData[2]}
          isEditing={editingBlock === bmcData[2].id}
          onEdit={setEditingBlock}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onEditItem={editItem}
          newItem={newItem}
          setNewItem={setNewItem}
          isApproved={actuallyApproved}
        />

        {/* Channels - Fourth column, bottom row */}
        <BMCBlockComponent
          block={bmcData[5]}
          isEditing={editingBlock === bmcData[5].id}
          onEdit={setEditingBlock}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          onEditItem={editItem}
          newItem={newItem}
          setNewItem={setNewItem}
          isApproved={actuallyApproved}
        />

        {/* Bottom row: Cost Structure + Revenue Streams */}
        <div className="col-span-5 grid grid-cols-2 gap-4">
          <BMCBlockComponent
            block={bmcData[7]}
            isEditing={editingBlock === bmcData[7].id}
            onEdit={setEditingBlock}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onEditItem={editItem}
            newItem={newItem}
            setNewItem={setNewItem}
            isApproved={actuallyApproved}
          />

          <BMCBlockComponent
            block={bmcData[8]}
            isEditing={editingBlock === bmcData[8].id}
            onEdit={setEditingBlock}
            onAddItem={addItem}
            onRemoveItem={removeItem}
            onEditItem={editItem}
            newItem={newItem}
            setNewItem={setNewItem}
            isApproved={actuallyApproved}
          />
        </div>
      </div>
    </div>
  );
};

interface BMCBlockComponentProps {
  block: BMCBlock;
  isEditing: boolean;
  onEdit: (blockId: string | null) => void;
  onAddItem: (blockId: string) => void;
  onRemoveItem: (blockId: string, itemIndex: number) => void;
  onEditItem: (blockId: string, itemIndex: number, newValue: string) => void;
  newItem: string;
  setNewItem: (value: string) => void;
  isApproved: boolean;
}

const BMCBlockComponent: React.FC<BMCBlockComponentProps> = ({
  block,
  isEditing,
  onEdit,
  onAddItem,
  onRemoveItem,
  onEditItem,
  newItem,
  setNewItem,
  isApproved,
}) => {
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editingItemValue, setEditingItemValue] = useState("");

  const handleEditItem = (index: number, value: string) => {
    setEditingItemIndex(index);
    setEditingItemValue(value);
  };

  const saveEditedItem = () => {
    if (editingItemIndex !== null) {
      onEditItem(block.id, editingItemIndex, editingItemValue);
      setEditingItemIndex(null);
      setEditingItemValue("");
    }
  };

  return (
    <Card
      className={`h-full ${block.color} transition-all duration-200 hover:shadow-md`}
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-center flex items-center justify-center gap-2">
          {block.title}
          <block.icon className="h-6 w-6 text-gray-700" />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div
          className={`space-y-2 ${
            block.items.length > 4 ? "max-h-64 overflow-y-auto pr-1" : ""
          }`}
          style={
            block.items.length > 4
              ? {
                  scrollbarWidth: "thin",
                  scrollbarColor: "#cbd5e1 #f1f5f9",
                }
              : {}
          }
        >
          {block.items.map((item, index) => (
            <div key={index} className="group relative">
              {editingItemIndex === index ? (
                <div className="space-y-2">
                  <Textarea
                    value={editingItemValue}
                    onChange={(e) => setEditingItemValue(e.target.value)}
                    className="text-xs min-h-[60px] resize-none"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={saveEditedItem}
                      className="h-6 px-2 text-xs"
                    >
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingItemIndex(null)}
                      className="h-6 px-2 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-white/70 p-2 rounded text-xs border relative group hover:bg-white/90 transition-colors">
                  {item}
                  {!isApproved && (
                    <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEditItem(index, item)}
                        className="h-5 w-5 p-0"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveItem(block.id, index)}
                        className="h-5 w-5 p-0 text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {isEditing && (
          <div className="space-y-2">
            <Textarea
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              placeholder="Add new item..."
              className="text-xs min-h-[60px] resize-none"
              autoFocus
            />
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="default"
                onClick={() => onAddItem(block.id)}
                className="h-6 px-2 text-xs"
              >
                Add
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(null)}
                className="h-6 px-2 text-xs"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {!isEditing && !isApproved && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onEdit(block.id)}
            className="w-full h-8 text-xs gap-1"
          >
            <Plus className="h-3 w-3" />
            Add Item
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default BusinessModelCanvas;
