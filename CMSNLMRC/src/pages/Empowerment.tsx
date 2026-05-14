import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Users, Gift, FolderOpen, Heart, Briefcase, GraduationCap, Zap } from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ActionItem {
  id: string;
  icon: any;
  title: string;
  subtitle: string;
  color: string;
}

interface CategoryItem {
  id: string;
  icon: any;
  title: string;
  count: number;
  color: string;
}

const SortableActionCard = ({ item }: { item: ActionItem }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = item.icon;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-move hover:shadow-lg transition-all border-t-4"
    >
      <CardContent className="p-6 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className={`p-4 ${item.color} rounded-lg`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          <div>
            <p className="font-semibold">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.subtitle}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SortableCategoryCard = ({ item }: { item: CategoryItem }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = item.icon;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-move hover:shadow-lg transition-all border-t-4"
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className={`p-3 ${item.color} rounded-lg`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-semibold text-lg">{item.title}</p>
            <p className="text-sm text-muted-foreground">{item.count} Programmes</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Empowerment() {
  const [quickActions, setQuickActions] = useState<ActionItem[]>([
    { id: "add", icon: Plus, title: "Add", subtitle: "Programme", color: "bg-blue-500" },
    { id: "create", icon: Edit, title: "Create", subtitle: "Custom", color: "bg-orange-500" },
    { id: "parent", icon: Users, title: "Parent", subtitle: "Records", color: "bg-green-500" },
    { id: "grants", icon: Gift, title: "Grants", subtitle: "& Tools", color: "bg-purple-500" },
    { id: "view", icon: FolderOpen, title: "View", subtitle: "Templates", color: "bg-gray-500" },
  ]);

  const [categories, setCategories] = useState<CategoryItem[]>([
    { id: "life-skills", icon: Heart, title: "Life Skills", count: 0, color: "bg-orange-500" },
    { id: "business", icon: Briefcase, title: "Business Skills", count: 0, color: "bg-green-500" },
    { id: "parenting", icon: Users, title: "Parenting", count: 0, color: "bg-purple-500" },
    { id: "capacity", icon: Zap, title: "Capacity Building", count: 0, color: "bg-blue-500" },
    { id: "entrepreneur", icon: GraduationCap, title: "Entrepreneurship", count: 0, color: "bg-orange-500" },
    { id: "other", icon: FolderOpen, title: "Other", count: 0, color: "bg-gray-500" },
  ]);

  const actionsSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const categoriesSensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleActionsDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setQuickActions((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleCategoriesDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  return (
    <div className="min-h-screen bg-background w-full max-w-full overflow-x-hidden">
      <div className="relative bg-gradient-to-r from-purple-600 to-purple-700 h-24 flex items-center px-4 sm:px-6 lg:px-8 w-full max-w-full">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="relative">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Empowerment</h1>
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-t-4 border-t-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FolderOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">TOTAL</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-green-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">ACTIVE</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Heart className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">LIFE SKILLS</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-t-4 border-t-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-3xl font-bold">0</p>
                  <p className="text-sm text-muted-foreground">REHABILITATION</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Draggable */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-xl">Quick Actions</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Common empowerment department tasks (drag to reorder)</p>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={actionsSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleActionsDragEnd}
            >
              <SortableContext items={quickActions.map((item) => item.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {quickActions.map((item) => (
                    <SortableActionCard key={item.id} item={item} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>

        {/* Programme Categories - Draggable */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-orange-500" />
              <CardTitle className="text-xl">Programme Categories</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">Browse programmes by category (drag to reorder)</p>
          </CardHeader>
          <CardContent>
            <DndContext
              sensors={categoriesSensors}
              collisionDetection={closestCenter}
              onDragEnd={handleCategoriesDragEnd}
            >
              <SortableContext items={categories.map((item) => item.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categories.map((item) => (
                    <SortableCategoryCard key={item.id} item={item} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
        </Card>

        {/* No Programmes Section */}
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center gap-4">
              <Heart className="h-16 w-16 text-muted-foreground" />
              <div>
                <h3 className="text-xl font-bold mb-2">No Programmes</h3>
                <p className="text-muted-foreground">
                  No empowerment programmes found. Create new programmes to get started.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
