import { Types, Document } from "mongoose";

interface ISubcategory {
  id: string;
  name: string;
  selected: boolean;
  popular?: boolean;
}

interface ICategory extends Document {
  _id: Types.ObjectId;
  id: string;
  name: string;
  icon: string;
  image: string;
  title: string;
  description?: string;
  subcategories: ISubcategory[];
  createdAt: Date;
  updatedAt: Date;
}

export default ICategory;